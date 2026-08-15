import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { nombre, SEUILS, tauxRemplissage } from '@/shared/utils/remplissage';
import { useClasseStore } from '../store';

/**
 * Statistiques des classes : effectifs, capacités, remplissage et diagnostics.
 *
 * ### Pourquoi `/classes/analytics/dashboard-global` n'est plus appelé
 *
 * Les quatre compteurs de l'ancien onglet venaient de `v_dashboard_global_classe`.
 * Trois d'entre eux sont **faux** : la vue somme `capacite_max` après une
 * jointure sur `inscriptions`, si bien que chaque classe compte autant de fois
 * qu'elle a d'inscrits. Relevé en base : **36 325 places annoncées pour 5 400
 * réelles**, d'où des « places disponibles » gonflées d'autant et un taux
 * d'occupation d'environ 2,5 % au lieu de 15 %. Seul `total_etudiants_inscrits`
 * (un `COUNT(DISTINCT)`) résistait.
 *
 * `v_organisation_classes` (`GET /classes/stats/organisations`) est groupée
 * **par classe** : la capacité y est une constante du groupe. Elle porte en
 * outre le cycle, la filière, le niveau et le statut de chaque classe — de quoi
 * agréger dans n'importe quel sens sans requête supplémentaire.
 *
 * ### Deux comptes d'effectif cohabitent dans l'application
 *
 * `v_organisation_classes` ne compte que les inscriptions `ACTIVE` ou `VALIDEE`
 * (832 en base), tandis que `v_classes_effectifs`, servie par `GET /classes` et
 * lue par les onglets « Liste » et « Par filière », les compte **toutes** (893).
 * L'écart n'est pas une erreur : ce sont deux questions différentes. Les
 * statistiques retiennent le périmètre restreint — un dossier en attente n'est
 * pas une place occupée.
 */

/** Les libellés de chaque dimension d'agrégation proposée par l'onglet. */
export const DIMENSIONS = [
  { cle: 'cycle', label: 'Cycle', colonne: 'Cycle' },
  { cle: 'filiere', label: 'Filière', colonne: 'Filière' },
  { cle: 'niveau', label: 'Niveau', colonne: 'Niveau' },
];

/**
 * Normalise les lignes de `v_organisation_classes`.
 *
 * Le taux est **recalculé** plutôt que lu : la vue l'arrondit à l'entier
 * (`round(...)` sans décimale), ce qui suffit pour une barre de progression mais
 * fausse les moyennes qu'on en tire.
 *
 * @param {any[]} lignes
 */
export function enrichirClasses(lignes) {
  return lignes.map((ligne) => {
    const effectif = nombre(ligne.effectif);
    const capacite = nombre(ligne.capacite);

    return {
      id: ligne.id,
      classe: ligne.classe ?? '—',
      filiere: ligne.filiere ?? 'Filière non renseignée',
      cycle: ligne.cycle ?? 'Cycle non renseigné',
      cycleCode: ligne.cycle_code ?? '—',
      niveau: ligne.niveau ?? '—',
      effectif,
      capacite,
      taux: tauxRemplissage(effectif, capacite),
      placesRestantes: Math.max(capacite - effectif, 0),
      statut: ligne.statut ?? '—',
    };
  });
}

/**
 * Cumule les classes sur une dimension (cycle, filière ou niveau).
 * @param {ReturnType<typeof enrichirClasses>} classes
 * @param {'cycle'|'filiere'|'niveau'} dimension
 */
export function regrouperPar(classes, dimension) {
  const groupes = new Map();

  for (const classe of classes) {
    const cle = classe[dimension] ?? '—';
    const cumul = groupes.get(cle) ?? {
      libelle: cle,
      nbClasses: 0,
      effectif: 0,
      capacite: 0,
      classesPleines: 0,
      classesVides: 0,
    };

    cumul.nbClasses += 1;
    cumul.effectif += classe.effectif;
    cumul.capacite += classe.capacite;
    if (classe.capacite > 0 && classe.taux >= SEUILS.SATUREE) cumul.classesPleines += 1;
    if (classe.effectif === 0) cumul.classesVides += 1;
    groupes.set(cle, cumul);
  }

  return [...groupes.values()]
    .map((groupe) => ({
      ...groupe,
      taux: tauxRemplissage(groupe.effectif, groupe.capacite),
      placesRestantes: Math.max(groupe.capacite - groupe.effectif, 0),
      tailleMoyenne: groupe.nbClasses > 0 ? groupe.effectif / groupe.nbClasses : 0,
    }))
    .sort((a, b) => b.effectif - a.effectif);
}

/**
 * Répartition des classes par palier de remplissage. Les paliers sont ceux de
 * `SEUILS` : une classe rangée dans « saturée » ici ne peut pas apparaître verte
 * ailleurs.
 * @param {ReturnType<typeof enrichirClasses>} classes
 */
export function repartitionParPalier(classes) {
  const paliers = [
    { cle: 'vides', libelle: 'Sans inscrit', couleur: 'rgba(108, 117, 125, 0.85)', nb: 0 },
    {
      cle: 'sous_utilisees',
      libelle: `Moins de ${SEUILS.SOUS_UTILISEE} %`,
      couleur: 'rgba(23, 162, 184, 0.85)',
      nb: 0,
    },
    {
      cle: 'saines',
      libelle: `${SEUILS.SOUS_UTILISEE} à ${SEUILS.TENDUE} %`,
      couleur: 'rgba(40, 167, 69, 0.85)',
      nb: 0,
    },
    {
      cle: 'tendues',
      libelle: `${SEUILS.TENDUE} à ${SEUILS.SATUREE} %`,
      couleur: 'rgba(255, 193, 7, 0.85)',
      nb: 0,
    },
    { cle: 'saturees', libelle: 'Complètes', couleur: 'rgba(220, 53, 69, 0.85)', nb: 0 },
  ];

  const index = Object.fromEntries(paliers.map((palier) => [palier.cle, palier]));

  for (const classe of classes) {
    if (classe.effectif === 0) index.vides.nb += 1;
    else if (classe.capacite === 0 || classe.taux < SEUILS.SOUS_UTILISEE)
      index.sous_utilisees.nb += 1;
    else if (classe.taux < SEUILS.TENDUE) index.saines.nb += 1;
    else if (classe.taux < SEUILS.SATUREE) index.tendues.nb += 1;
    else index.saturees.nb += 1;
  }

  return paliers;
}

/**
 * Lectures dérivées des chiffres affichés — rien n'y est écrit d'avance.
 * @param {ReturnType<typeof enrichirClasses>} classes
 * @param {{effectifTotal: number, capaciteTotale: number, tauxGlobal: number}} indicateurs
 */
export function analyserClasses(classes, indicateurs) {
  if (!classes.length) return [];

  const analyses = [];

  const saturees = classes.filter((classe) => classe.capacite > 0 && classe.taux >= SEUILS.SATUREE);
  if (saturees.length) {
    analyses.push({
      ton: 'danger',
      icone: 'bi-exclamation-octagon',
      titre: `${saturees.length} classe(s) au complet`,
      message: `${saturees
        .slice(0, 6)
        .map((classe) => classe.classe)
        .join(
          ', '
        )}${saturees.length > 6 ? '…' : ''} — plus aucune place. Toute nouvelle inscription sur ces classes exige d'en ouvrir une autre.`,
    });
  }

  const sansCapacite = classes.filter((classe) => classe.capacite === 0);
  if (sansCapacite.length) {
    analyses.push({
      ton: 'warning',
      icone: 'bi-question-circle',
      titre: `${sansCapacite.length} classe(s) sans capacité déclarée`,
      message: `${sansCapacite
        .slice(0, 6)
        .map((classe) => classe.classe)
        .join(
          ', '
        )}${sansCapacite.length > 6 ? '…' : ''} — sans capacité, aucun taux de remplissage n'est calculable et la classe pèse zéro dans les totaux.`,
    });
  }

  const vides = classes.filter((classe) => classe.effectif === 0);
  if (vides.length) {
    const placesImmobilisees = vides.reduce((somme, classe) => somme + classe.capacite, 0);
    analyses.push({
      ton: 'info',
      icone: 'bi-person-x',
      titre: `${vides.length} classe(s) sans inscrit`,
      message: `${placesImmobilisees} place(s) ouvertes n'accueillent personne sur l'année académique active, soit ${((placesImmobilisees / Math.max(indicateurs.capaciteTotale, 1)) * 100).toFixed(1)} % de la capacité déclarée.`,
    });
  }

  const tendues = classes.filter(
    (classe) => classe.capacite > 0 && classe.taux >= SEUILS.TENDUE && classe.taux < SEUILS.SATUREE
  );
  if (tendues.length) {
    analyses.push({
      ton: 'warning',
      icone: 'bi-hourglass-split',
      titre: `${tendues.length} classe(s) proches de la saturation`,
      message: `Au-delà de ${SEUILS.TENDUE} % de remplissage, il reste moins de deux places sur dix : ${tendues
        .slice(0, 6)
        .map((classe) => `${classe.classe} (${classe.taux.toFixed(0)} %)`)
        .join(', ')}${tendues.length > 6 ? '…' : ''}.`,
    });
  }

  const remplies = classes.filter((classe) => classe.effectif > 0);
  if (remplies.length) {
    const moyenne =
      remplies.reduce((somme, classe) => somme + classe.effectif, 0) / remplies.length;
    analyses.push({
      ton: 'secondary',
      icone: 'bi-people',
      titre: 'Taille moyenne des classes',
      message: `${moyenne.toFixed(1)} étudiant(s) par classe occupée, pour un remplissage global de ${indicateurs.tauxGlobal.toFixed(1)} % et ${indicateurs.effectifTotal} inscription(s).`,
    });
  }

  if (!saturees.length && !tendues.length && remplies.length) {
    analyses.push({
      ton: 'success',
      icone: 'bi-check-circle',
      titre: 'Aucune tension de capacité',
      message: `Aucune des ${classes.length} classe(s) n'a dépassé ${SEUILS.TENDUE} % de sa capacité.`,
    });
  }

  return analyses;
}

/** Assemble la lecture et les indicateurs de l'onglet. */
export function useClasseStatistiques() {
  const classeStore = useClasseStore();
  const { organisationTree, loading } = storeToRefs(classeStore);

  const classes = computed(() =>
    enrichirClasses(Array.isArray(organisationTree.value) ? organisationTree.value : [])
  );

  const indicateurs = computed(() => {
    const liste = classes.value;
    const effectifTotal = liste.reduce((somme, classe) => somme + classe.effectif, 0);
    const capaciteTotale = liste.reduce((somme, classe) => somme + classe.capacite, 0);

    return {
      nbClasses: liste.length,
      nbClassesOccupees: liste.filter((classe) => classe.effectif > 0).length,
      nbCycles: new Set(liste.map((classe) => classe.cycle)).size,
      nbFilieres: new Set(liste.map((classe) => classe.filiere)).size,
      nbNiveaux: new Set(liste.map((classe) => classe.niveau)).size,
      effectifTotal,
      capaciteTotale,
      placesDisponibles: Math.max(capaciteTotale - effectifTotal, 0),
      tauxGlobal: tauxRemplissage(effectifTotal, capaciteTotale),
    };
  });

  const paliers = computed(() => repartitionParPalier(classes.value));
  const analyses = computed(() => analyserClasses(classes.value, indicateurs.value));

  const charger = () => classeStore.fetchOrganisationTree();

  return { charger, loading, classes, indicateurs, paliers, analyses };
}
