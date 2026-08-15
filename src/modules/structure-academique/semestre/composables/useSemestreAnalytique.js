import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { nombre } from '@/shared/utils/remplissage';
import { useSemestreStore } from '../store';
import { useAnneeStore } from '../../annee/store';

/**
 * Charge d'enseignement d'une année académique.
 *
 * ### Les années antérieures viennent de la base, plus du calendrier
 *
 * Le sélecteur d'année était **calculé à partir de la date du jour** : « si nous
 * sommes en septembre ou après, l'année académique est N/N+1 », et il n'offrait
 * que cette année-là plus la précédente. Deux conséquences : les années
 * réellement présentes en base et absentes de ce calcul étaient inatteignables
 * (l'année à venir, par exemple), et une année inexistante pouvait être demandée
 * au serveur, qui répondait un tableau vide sans que rien n'explique pourquoi.
 *
 * Les options viennent maintenant de `GET /annees`. Le paramètre `period` de
 * `/semestres/analytics/dashboard` est comparé à `anneeacademique.code` côté
 * SQL : ce sont donc exactement ces codes qu'il faut envoyer.
 *
 * ### Ce que le tableau de bord ne peut pas servir
 *
 * Trois valeurs de cette réponse sont fabriquées et ne sont **pas** affichées :
 *
 * | Champ                        | Ce qu'il vaut réellement                                    |
 * | ---------------------------- | ------------------------------------------------------------ |
 * | `kpis.taux_assiduite_global` | la constante `92.4`, écrite en dur dans la fonction SQL      |
 * | `matrix[].moyenne_generale`  | `AVG(12.5 + RANDOM() * 3)` — une autre valeur à chaque appel |
 * | `typology`                   | une seule ligne, donc toujours « 100 % », sans regroupement  |
 *
 * `llm_summary`, qu'affichait l'encadré de bas de page, n'est pas non plus dans
 * la réponse : le texte visible était toujours le message de repli. Aucune table
 * de présence n'existant en base, l'assiduité ne peut pas être calculée — mieux
 * vaut ne rien afficher qu'un chiffre inventé. Ce que la réponse porte de réel —
 * volumes horaires, nombre d'UE, enseignants distincts, maquettes — est exploité
 * ci-dessous, et la répartition remplacée par des regroupements calculés à
 * partir de la matrice.
 */

/** Seuil de conformité appliqué par `get_matrix_analytics` (`statut_maquette`). */
export const HEURES_MINIMALES = 120;

/**
 * Options du sélecteur d'année, la plus récente d'abord.
 * @param {any[]} annees Liste `GET /annees`.
 */
export function optionsAnnees(annees) {
  return [...annees]
    .filter((annee) => annee?.code)
    .sort((a, b) => String(b.code).localeCompare(String(a.code)))
    .map((annee) => ({
      value: annee.code,
      label: annee.est_active ? `${annee.code} (en cours)` : annee.code,
      active: Boolean(annee.est_active),
      statut: annee.statut ?? '',
    }));
}

/**
 * Normalise les lignes de la matrice. Une ligne = un semestre × une filière ×
 * un niveau.
 * @param {any[]} matrice
 */
export function normaliserMatrice(matrice) {
  return matrice.map((ligne, index) => {
    const nbUes = nombre(ligne.nb_ues);
    const heures = nombre(ligne.total_heures);

    return {
      // `semestre_id` se répète d'une filière à l'autre : il ne peut pas servir
      // de clé de liste.
      cle: `${ligne.semestre_id ?? 's'}-${ligne.filiere ?? ''}-${ligne.niveau ?? ''}-${index}`,
      semestre: ligne.semestre_code ?? '—',
      filiere: ligne.filiere ?? 'Filière non renseignée',
      niveau: ligne.niveau ?? '—',
      nbUes,
      heures,
      heuresParUe: nbUes > 0 ? heures / nbUes : 0,
      conforme: ligne.statut_maquette === 'Conforme',
      statutMaquette: ligne.statut_maquette || 'Inconnu',
    };
  });
}

/**
 * Cumule la matrice sur une clé (`semestre` ou `filiere`), volume décroissant.
 * @param {ReturnType<typeof normaliserMatrice>} lignes
 * @param {'semestre'|'filiere'|'niveau'} cle
 */
export function regrouperCharge(lignes, cle) {
  const groupes = new Map();
  const heuresTotales = lignes.reduce((somme, ligne) => somme + ligne.heures, 0);

  for (const ligne of lignes) {
    const libelle = ligne[cle];
    const cumul = groupes.get(libelle) ?? {
      libelle,
      heures: 0,
      nbUes: 0,
      nbLignes: 0,
      nbConformes: 0,
    };

    cumul.heures += ligne.heures;
    cumul.nbUes += ligne.nbUes;
    cumul.nbLignes += 1;
    if (ligne.conforme) cumul.nbConformes += 1;
    groupes.set(libelle, cumul);
  }

  return [...groupes.values()]
    .map((groupe) => ({
      ...groupe,
      part: heuresTotales > 0 ? (groupe.heures / heuresTotales) * 100 : 0,
    }))
    .sort((a, b) => b.heures - a.heures);
}

/**
 * Lectures dérivées de la matrice — les seules « analyses » de cet écran qui
 * reposent sur des chiffres réels.
 * @param {ReturnType<typeof normaliserMatrice>} lignes
 * @param {{nbConformes: number, heuresParUe: number}} indicateurs
 */
export function analyserCharge(lignes, indicateurs) {
  if (!lignes.length) return [];

  const analyses = [];
  const nonConformes = lignes.filter((ligne) => !ligne.conforme);

  if (nonConformes.length) {
    analyses.push({
      ton: 'danger',
      icone: 'bi-exclamation-triangle',
      titre: `${nonConformes.length} maquette(s) sous le volume minimal`,
      message: `Moins de ${HEURES_MINIMALES} h programmées pour ${nonConformes
        .slice(0, 5)
        .map((ligne) => `${ligne.semestre} · ${ligne.filiere} ${ligne.niveau}`)
        .join(', ')}${nonConformes.length > 5 ? '…' : ''}.`,
    });
  } else {
    analyses.push({
      ton: 'success',
      icone: 'bi-check-circle',
      titre: 'Toutes les maquettes atteignent le volume minimal',
      message: `Les ${indicateurs.nbConformes} maquette(s) de la période dépassent ${HEURES_MINIMALES} h d'enseignement.`,
    });
  }

  const sansUe = lignes.filter((ligne) => ligne.nbUes === 0);
  if (sansUe.length) {
    analyses.push({
      ton: 'warning',
      icone: 'bi-journal-x',
      titre: `${sansUe.length} maquette(s) sans unité d'enseignement`,
      message:
        "Aucun module n'est rattaché à ces couples semestre × classe : la maquette est ouverte mais vide.",
    });
  }

  const parSemestre = regrouperCharge(lignes, 'semestre');
  if (parSemestre.length > 1) {
    const [premier] = parSemestre;
    const dernier = parSemestre[parSemestre.length - 1];
    const ecart = premier.heures - dernier.heures;
    if (ecart > 0) {
      analyses.push({
        ton: 'info',
        icone: 'bi-bar-chart-steps',
        titre: 'Charge inégale entre semestres',
        message: `${premier.libelle} programme ${premier.heures} h contre ${dernier.heures} h pour ${dernier.libelle}, soit ${ecart} h d'écart (${premier.part.toFixed(1)} % du volume total sur le seul ${premier.libelle}).`,
      });
    }
  }

  if (indicateurs.heuresParUe > 0) {
    analyses.push({
      ton: 'secondary',
      icone: 'bi-clock-history',
      titre: 'Volume moyen par unité',
      message: `${indicateurs.heuresParUe.toFixed(1)} h par unité d'enseignement sur l'ensemble de la période.`,
    });
  }

  return analyses;
}

/** Assemble le sélecteur d'année, le tableau de bord et ses dérivées. */
export function useSemestreAnalytique() {
  const semestreStore = useSemestreStore();
  const anneeStore = useAnneeStore();

  const { analytics, loading: semestreLoading } = storeToRefs(semestreStore);
  const { items: annees, loading: anneeLoading } = storeToRefs(anneeStore);

  const anneeSelectionnee = ref('');

  const options = computed(() => optionsAnnees(annees.value));

  const lignes = computed(() => normaliserMatrice(analytics.value?.matrix ?? []));

  const indicateurs = computed(() => {
    const liste = lignes.value;
    const kpis = analytics.value?.kpis ?? {};
    const heures = liste.reduce((somme, ligne) => somme + ligne.heures, 0);
    const nbUes = liste.reduce((somme, ligne) => somme + ligne.nbUes, 0);
    const nbConformes = liste.filter((ligne) => ligne.conforme).length;

    return {
      // Les trois compteurs du serveur portent sur toute la période, sans
      // double compte : on les préfère à une somme de la matrice, où un même
      // module apparaît dans chaque classe qui le suit.
      volumeHoraire: nombre(kpis.volume_horaire_global),
      totalUes: nombre(kpis.total_ues),
      corpsEnseignant: nombre(kpis.corps_enseignant_total),
      nbMaquettes: liste.length,
      nbConformes,
      tauxConformite: liste.length > 0 ? (nbConformes / liste.length) * 100 : 0,
      heuresProgrammees: heures,
      uesProgrammees: nbUes,
      heuresParUe: nbUes > 0 ? heures / nbUes : 0,
      nbSemestres: new Set(liste.map((ligne) => ligne.semestre)).size,
      nbFilieres: new Set(liste.map((ligne) => ligne.filiere)).size,
    };
  });

  const parSemestre = computed(() => regrouperCharge(lignes.value, 'semestre'));
  const parFiliere = computed(() => regrouperCharge(lignes.value, 'filiere'));
  const analyses = computed(() => analyserCharge(lignes.value, indicateurs.value));

  /** Charge la liste des années, puis se cale sur l'année active. */
  const charger = async () => {
    await anneeStore.fetchAll();
    if (!anneeSelectionnee.value) {
      const active = options.value.find((option) => option.active);
      anneeSelectionnee.value = active?.value ?? options.value[0]?.value ?? '';
    }
  };

  // Sans année choisie, la requête part sans `period` et le serveur répond 400 :
  // le garde est ici, pas dans le composant.
  watch(anneeSelectionnee, (code) => {
    if (code) semestreStore.fetchAnalytics(code);
  });

  return {
    charger,
    loading: computed(() => semestreLoading.value || anneeLoading.value),
    anneeSelectionnee,
    options,
    analytics,
    lignes,
    indicateurs,
    parSemestre,
    parFiliere,
    analyses,
  };
}
