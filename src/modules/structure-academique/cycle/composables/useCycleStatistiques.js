import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { nombre, SEUILS, tauxRemplissage } from '@/shared/utils/remplissage';
import { useCycleStore } from '../store';
import { useClasseStore } from '../../classe/store';

/**
 * Statistiques des cycles : effectifs, capacités, remplissage et diagnostics.
 *
 * ### Pourquoi la capacité ne vient pas de `/cycles/stats/organisations`
 *
 * `v_organisation_cycles` sert bien une `capacite_totale` et un
 * `taux_remplissage`, mais tous deux sont **faux** : la vue somme
 * `classe.capacite_max` *après* une jointure sur `inscriptions`, si bien que la
 * capacité de chaque classe est multipliée par son nombre d'inscrits. Relevé en
 * base : 11 130 places annoncées pour un cycle qui en compte 1 800, et un taux
 * de remplissage de 2,45 % pour tous les cycles — le même symptôme frappe
 * `v_organisation_filieres` et `v_dashboard_global_classe`.
 *
 * `v_organisation_classes` (`GET /classes/stats/organisations`) est groupée
 * **par classe** : `capacite_max` y est une constante du groupe, jamais sommée
 * en travers d'une jointure. Elle porte en outre le cycle, la filière et le
 * niveau de chaque classe. Les agrégats par cycle sont donc recomposés ici, à
 * partir de cette lecture saine — pas d'appel supplémentaire, l'onglet
 * « Organisation » des classes la charge déjà et le store la garde.
 *
 * `GET /cycles/stats/distribution` reste appelé pour une raison précise : il
 * compte les étudiants **distincts** (`COUNT(DISTINCT etudiant_id)`), là où la
 * somme des effectifs de classes compte les inscriptions. Les deux chiffres
 * répondent à deux questions différentes, et l'écart entre eux se lit.
 */

/**
 * Recompose un cycle par ligne, en croisant les trois lectures.
 *
 * @param {any[]} cycles Liste `GET /cycles` — identité, durée, crédits.
 * @param {any[]} classes Lignes de `v_organisation_classes`.
 * @param {any[]} distribution Lignes de `v_distribution_cycle`.
 */
export function enrichirCycles(cycles, classes, distribution) {
  const classesParCycle = new Map();
  for (const classe of classes) {
    const cle = String(classe.cycle_code ?? '');
    if (!classesParCycle.has(cle)) classesParCycle.set(cle, []);
    classesParCycle.get(cle).push(classe);
  }

  const distributionParCycle = new Map(
    distribution.map((ligne) => [String(ligne.cycle_code ?? ''), ligne])
  );

  return cycles.map((cycle) => {
    const sesClasses = classesParCycle.get(String(cycle.code)) ?? [];
    const effectif = sesClasses.reduce((somme, classe) => somme + nombre(classe.effectif), 0);
    const capacite = sesClasses.reduce((somme, classe) => somme + nombre(classe.capacite), 0);
    const filieres = [...new Set(sesClasses.map((classe) => classe.filiere).filter(Boolean))];
    const niveaux = [...new Set(sesClasses.map((classe) => classe.niveau).filter(Boolean))];

    return {
      id: cycle.id,
      code: cycle.code,
      // La table `cycle` n'a pas de colonne `nom` : `diplome` **est** son
      // libellé. L'ancien écran affichait `cycle_nom`, absent de toutes les
      // vues, et retombait donc toujours sur « Cycle Académique ».
      diplome: cycle.diplome || cycle.designation || 'Cycle académique',
      dureeAnnees: nombre(cycle.duree_annees),
      creditsTotal: nombre(cycle.credits_total),
      nbFilieres: filieres.length,
      filieres,
      niveaux,
      nbClasses: sesClasses.length,
      effectif,
      capacite,
      taux: tauxRemplissage(effectif, capacite),
      placesRestantes: Math.max(capacite - effectif, 0),
      tailleMoyenneClasse: sesClasses.length > 0 ? effectif / sesClasses.length : 0,
      /** Étudiants distincts comptés par le serveur, quand la lecture est chargée. */
      etudiantsDistincts: nombre(distributionParCycle.get(String(cycle.code))?.nb_etudiants),
      classesSaturees: sesClasses.filter(
        (classe) => nombre(classe.capacite) > 0 && nombre(classe.taux) >= SEUILS.SATUREE
      ).length,
      classesVides: sesClasses.filter((classe) => nombre(classe.effectif) === 0).length,
    };
  });
}

/**
 * Lectures dérivées des chiffres affichés. Rien n'y est écrit d'avance : chaque
 * constat naît d'un test sur les données et disparaît avec la situation qu'il
 * décrit. Triées du plus grave au plus anodin.
 *
 * @param {ReturnType<typeof enrichirCycles>} cycles
 * @param {{effectifTotal: number, tauxGlobal: number}} indicateurs
 */
export function analyserCycles(cycles, indicateurs) {
  if (!cycles.length) return [];

  const analyses = [];
  const actifs = cycles.filter((cycle) => cycle.effectif > 0);

  const satures = cycles.filter((cycle) => cycle.capacite > 0 && cycle.taux >= SEUILS.SATUREE);
  if (satures.length) {
    analyses.push({
      ton: 'danger',
      icone: 'bi-exclamation-octagon',
      titre: `${satures.length} cycle(s) au complet`,
      message: `${satures.map((cycle) => cycle.code).join(', ')} — plus aucune place déclarée. Ouvrir une classe ou relever la capacité avant la prochaine rentrée.`,
    });
  }

  const classesSaturees = cycles.reduce((somme, cycle) => somme + cycle.classesSaturees, 0);
  if (classesSaturees > 0 && !satures.length) {
    analyses.push({
      ton: 'warning',
      icone: 'bi-people-fill',
      titre: `${classesSaturees} classe(s) pleine(s)`,
      message: `Le remplissage global reste à ${indicateurs.tauxGlobal.toFixed(1)} %, mais ${classesSaturees} classe(s) ont atteint leur capacité : la tension est locale, pas globale.`,
    });
  }

  const sansClasse = cycles.filter((cycle) => cycle.nbClasses === 0);
  if (sansClasse.length) {
    analyses.push({
      ton: 'warning',
      icone: 'bi-door-closed',
      titre: `${sansClasse.length} cycle(s) sans classe`,
      message: `${sansClasse.map((cycle) => cycle.code).join(', ')} — un cycle sans classe ne peut recevoir aucune inscription.`,
    });
  }

  const tete = [...actifs].sort((a, b) => b.effectif - a.effectif)[0];
  if (tete && indicateurs.effectifTotal > 0) {
    const part = (tete.effectif / indicateurs.effectifTotal) * 100;
    if (part >= 50) {
      analyses.push({
        ton: 'warning',
        icone: 'bi-pie-chart',
        titre: 'Effectifs concentrés',
        message: `${tete.diplome} rassemble à lui seul ${part.toFixed(1)} % des inscrits (${tete.effectif} sur ${indicateurs.effectifTotal}).`,
      });
    }
  }

  const sousUtilises = cycles.filter(
    (cycle) => cycle.effectif > 0 && cycle.capacite > 0 && cycle.taux < SEUILS.SOUS_UTILISEE
  );
  if (sousUtilises.length) {
    analyses.push({
      ton: 'info',
      icone: 'bi-graph-down-arrow',
      titre: `${sousUtilises.length} cycle(s) sous les ${SEUILS.SOUS_UTILISEE} %`,
      message: `${sousUtilises.map((cycle) => `${cycle.code} (${cycle.taux.toFixed(1)} %)`).join(', ')} — capacité ouverte mais peu remplie.`,
    });
  }

  const vides = cycles.filter((cycle) => cycle.effectif === 0);
  if (vides.length) {
    analyses.push({
      ton: 'secondary',
      icone: 'bi-person-x',
      titre: `${vides.length} cycle(s) sans inscrit`,
      message: `${vides.map((cycle) => cycle.code).join(', ')} — aucun inscrit sur l'année académique active.`,
    });
  }

  // L'écart entre étudiants distincts et inscriptions révèle les étudiants
  // rattachés à plus d'une classe : un chiffre qu'aucune des deux lectures ne
  // donne seule.
  const distincts = cycles.reduce((somme, cycle) => somme + cycle.etudiantsDistincts, 0);
  if (distincts > 0 && indicateurs.effectifTotal > distincts) {
    analyses.push({
      ton: 'info',
      icone: 'bi-people',
      titre: 'Inscriptions multiples',
      message: `${indicateurs.effectifTotal} inscriptions pour ${distincts} étudiants distincts : ${indicateurs.effectifTotal - distincts} étudiant(s) figurent dans plus d'une classe.`,
    });
  }

  if (!satures.length && !sansClasse.length && actifs.length) {
    analyses.push({
      ton: 'success',
      icone: 'bi-check-circle',
      titre: 'Aucune tension de capacité',
      message: `Aucun des ${actifs.length} cycle(s) actifs n'a atteint sa capacité, et tous disposent d'au moins une classe.`,
    });
  }

  return analyses;
}

/** Assemble les trois lectures et les indicateurs de l'onglet. */
export function useCycleStatistiques() {
  const cycleStore = useCycleStore();
  const classeStore = useClasseStore();

  const { items: cycles, stats: distribution, loading: cycleLoading } = storeToRefs(cycleStore);
  const { organisationTree, loading: classeLoading } = storeToRefs(classeStore);

  const classesOrganisation = computed(() =>
    Array.isArray(organisationTree.value) ? organisationTree.value : []
  );

  const cyclesEnrichis = computed(() =>
    enrichirCycles(
      cycles.value,
      classesOrganisation.value,
      Array.isArray(distribution.value) ? distribution.value : []
    )
  );

  const cyclesActifs = computed(() =>
    cyclesEnrichis.value
      .filter((cycle) => cycle.effectif > 0)
      .sort((a, b) => b.effectif - a.effectif)
  );

  const indicateurs = computed(() => {
    const liste = cyclesEnrichis.value;
    const effectifTotal = liste.reduce((somme, cycle) => somme + cycle.effectif, 0);
    const capaciteTotale = liste.reduce((somme, cycle) => somme + cycle.capacite, 0);
    const nbClasses = liste.reduce((somme, cycle) => somme + cycle.nbClasses, 0);
    const nbFilieres = liste.reduce((somme, cycle) => somme + cycle.nbFilieres, 0);

    return {
      nbCycles: liste.length,
      nbActifs: liste.filter((cycle) => cycle.effectif > 0).length,
      nbFilieres,
      nbClasses,
      effectifTotal,
      capaciteTotale,
      placesDisponibles: Math.max(capaciteTotale - effectifTotal, 0),
      tauxGlobal: tauxRemplissage(effectifTotal, capaciteTotale),
      etudiantsDistincts: liste.reduce((somme, cycle) => somme + cycle.etudiantsDistincts, 0),
    };
  });

  const analyses = computed(() => analyserCycles(cyclesEnrichis.value, indicateurs.value));

  /** Les trois lectures en parallèle ; les deux listes passent par leur cache. */
  const charger = async ({ force = false } = {}) => {
    await Promise.all([
      cycleStore.fetchAll({ force }),
      cycleStore.fetchDistributionStats(),
      classeStore.fetchOrganisationTree(),
    ]);
  };

  return {
    charger,
    loading: computed(() => cycleLoading.value || classeLoading.value),
    cyclesEnrichis,
    cyclesActifs,
    indicateurs,
    analyses,
  };
}
