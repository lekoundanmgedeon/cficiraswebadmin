import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { DECISION_JURY_LIST, decisionJuryInfo, SEXES } from '../../constants';
import { useConcoursStore } from '../store';
import { useCandidatStore } from '../../candidat/store';
import { useEpreuveConcoursStore } from '../../epreuve/store';

/**
 * Statistiques des résultats d'un concours.
 *
 * Tout est dérivé de trois lectures qui existent déjà — aucune n'a été inventée
 * pour cet écran :
 *
 * | Bloc                       | Source                                                   |
 * | -------------------------- | -------------------------------------------------------- |
 * | Moyennes, rangs, décisions | `GET /concours/:id/classement`                           |
 * | Notes épreuve par épreuve  | `GET /candidats/concours/:id/epreuve?epreuve_code=`       |
 * | Coefficients               | `GET /concours/:concoursId/epreuves`                      |
 *
 * `pg` sert ses `NUMERIC` en **chaînes** : `moyenne_generale` arrive
 * `"16.6818181818181818"`. Sans conversion, la moyenne des moyennes concatène.
 */

/**
 * Convertit une valeur servie par `pg`, ou rend `null` s'il n'y en a pas.
 *
 * ⚠️ `Number(null)` vaut **0**, et `Number('')` aussi. Un candidat **non noté**
 * — la jointure des notes est un `LEFT JOIN`, `note` arrive donc à `null` —
 * serait alors compté comme ayant eu zéro : la moyenne de l'épreuve s'effondre,
 * le nombre de « notés » est faux, et rien ne le signale. L'absence de note doit
 * rester une absence.
 *
 * @param {any} valeur
 * @returns {number|null}
 */
export const nombre = (valeur) => {
  if (valeur === null || valeur === undefined || valeur === '') return null;

  const converti = Number(valeur);
  return Number.isNaN(converti) ? null : converti;
};

/**
 * Paliers de moyenne. Bornes **inférieures incluses**, supérieures exclues —
 * sauf la dernière, qui va jusqu'à 20 : une moyenne de 20 doit être comptée.
 */
export const PALIERS = [
  { cle: '0-5', label: 'Moins de 5', min: 0, max: 5, variant: 'danger' },
  { cle: '5-8', label: '5 à 8', min: 5, max: 8, variant: 'danger' },
  { cle: '8-10', label: '8 à 10', min: 8, max: 10, variant: 'warning' },
  { cle: '10-12', label: '10 à 12', min: 10, max: 12, variant: 'info' },
  { cle: '12-14', label: '12 à 14', min: 12, max: 14, variant: 'primary' },
  { cle: '14-16', label: '14 à 16', min: 14, max: 16, variant: 'success' },
  { cle: '16-20', label: '16 et plus', min: 16, max: 20.001, variant: 'success' },
];

/**
 * Indicateurs de tête, calculés sur les moyennes réellement chiffrées.
 * @param {any[]} classement
 */
export function indicateursClassement(classement) {
  const moyennes = classement
    .map((ligne) => nombre(ligne.moyenne_generale))
    .filter((valeur) => valeur !== null);

  if (moyennes.length === 0) {
    return { nbClasses: classement.length, moyenne: null, max: null, min: null, ecartType: null };
  }

  const somme = moyennes.reduce((total, valeur) => total + valeur, 0);
  const moyenne = somme / moyennes.length;

  // Écart-type de population : on décrit **la** promotion, on n'estime pas les
  // paramètres d'une population plus large dont elle serait un échantillon.
  const variance =
    moyennes.reduce((total, valeur) => total + (valeur - moyenne) ** 2, 0) / moyennes.length;

  return {
    nbClasses: classement.length,
    moyenne,
    max: Math.max(...moyennes),
    min: Math.min(...moyennes),
    ecartType: Math.sqrt(variance),
  };
}

/**
 * Répartition des candidats par palier de moyenne.
 * @param {any[]} classement
 */
export function repartitionParPalier(classement) {
  const total = classement.length || 1;

  return PALIERS.map((palier) => {
    const nb = classement.filter((ligne) => {
      const moyenne = nombre(ligne.moyenne_generale);
      return moyenne !== null && moyenne >= palier.min && moyenne < palier.max;
    }).length;

    return { ...palier, nb, part: (nb / total) * 100 };
  });
}

/**
 * Décisions du jury, dans l'ordre du référentiel.
 *
 * Un concours non proclamé rend `decision_jury` nul pour tout le monde : on le
 * dit plutôt que d'afficher un camembert vide.
 *
 * @param {any[]} classement
 */
export function repartitionDecisions(classement) {
  const total = classement.length || 1;

  const lignes = DECISION_JURY_LIST.map((decision) => {
    const nb = classement.filter((ligne) => ligne.decision_jury === decision.code).length;
    return { ...decision, nb, part: (nb / total) * 100 };
  }).filter((ligne) => ligne.nb > 0);

  const proclames = lignes.reduce((somme, ligne) => somme + ligne.nb, 0);

  return {
    lignes,
    proclame: proclames > 0,
    nbProclames: proclames,
    /** Le taux d'admission ne se lit que sur les candidats effectivement délibérés. */
    tauxAdmission:
      proclames > 0
        ? (classement.filter((ligne) => ligne.admis === true).length / proclames) * 100
        : null,
    date: classement.find((ligne) => ligne.date_proclamation)?.date_proclamation ?? null,
  };
}

/**
 * Statistiques épreuve par épreuve, à partir des notes déjà chargées.
 *
 * @param {any[]} epreuves
 * @param {Record<string, any[]>} notesParEpreuve
 */
export function statistiquesParEpreuve(epreuves, notesParEpreuve) {
  return epreuves.map((epreuve) => {
    const lignes = notesParEpreuve[epreuve.code] ?? [];
    const notes = lignes.map((ligne) => nombre(ligne.note)).filter((note) => note !== null);

    const base = {
      code: epreuve.code,
      designation: epreuve.designation,
      coefficient: nombre(epreuve.coefficient) ?? 0,
      nbCandidats: lignes.length,
      nbNotes: notes.length,
    };

    if (notes.length === 0) {
      return { ...base, moyenne: null, max: null, min: null, tauxReussite: null };
    }

    return {
      ...base,
      moyenne: notes.reduce((total, note) => total + note, 0) / notes.length,
      max: Math.max(...notes),
      min: Math.min(...notes),
      // « Réussite » à l'échelle d'une épreuve : la moyenne de 10, seule borne
      // que la base impose (`note` ∈ [0, 20]).
      tauxReussite: (notes.filter((note) => note >= 10).length / notes.length) * 100,
    };
  });
}

/**
 * Répartition par sexe, et part des admis dans chaque sexe.
 * @param {any[]} classement
 */
export function repartitionParSexe(classement) {
  return SEXES.map((sexe) => {
    const lignes = classement.filter((ligne) => ligne.sexe === sexe.code);
    const admis = lignes.filter((ligne) => ligne.admis === true).length;

    return {
      code: sexe.code,
      label: sexe.label,
      nb: lignes.length,
      admis,
      tauxAdmission: lignes.length > 0 ? (admis / lignes.length) * 100 : null,
    };
  }).filter((ligne) => ligne.nb > 0);
}

/** Assemble les quatre lectures dérivées de l'onglet. */
export function useStatistiquesResultats(concoursId) {
  const concoursStore = useConcoursStore();
  const candidatStore = useCandidatStore();
  const epreuveStore = useEpreuveConcoursStore();

  const { classement, loading: concoursLoading } = storeToRefs(concoursStore);
  const { notesParEpreuve, loading: candidatLoading } = storeToRefs(candidatStore);
  const { ordonnees: epreuves } = storeToRefs(epreuveStore);

  const indicateurs = computed(() => indicateursClassement(classement.value));
  const paliers = computed(() => repartitionParPalier(classement.value));
  const decisions = computed(() => repartitionDecisions(classement.value));
  const parEpreuve = computed(() => statistiquesParEpreuve(epreuves.value, notesParEpreuve.value));
  const parSexe = computed(() => repartitionParSexe(classement.value));

  /**
   * Les épreuves, puis leurs notes — une requête par épreuve, gardée ensuite par
   * le store : rouvrir l'onglet ne coûte rien.
   */
  const charger = async () => {
    const id = typeof concoursId === 'function' ? concoursId() : concoursId;
    if (!id) return;

    await epreuveStore.fetchByConcours(id);
    await Promise.all(
      epreuves.value.map((epreuve) => candidatStore.fetchNotesEpreuve(id, epreuve.code))
    );
  };

  return {
    charger,
    loading: computed(() => concoursLoading.value || candidatLoading.value),
    classement,
    epreuves,
    indicateurs,
    paliers,
    decisions,
    parEpreuve,
    parSexe,
    decisionJuryInfo,
  };
}
