import { computed, ref, watch } from 'vue';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useFiliereStore } from '@/modules/structure-academique/filiere/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';

/**
 * Filtres année / filière / classe, en cascade.
 *
 * Le même triplet était réécrit dans quatre fichiers du module, chacun avec sa
 * variante de cascade — et trois d'entre eux appelaient
 * `classeStore.fetchClassesByFiliere()` à chaque changement de filière, ce qui
 * **écrasait `items` du store des classes**, un état partagé par toute
 * l'application. Ici, les classes sont chargées une fois puis filtrées en mémoire.
 *
 * ⚠️ L'annuaire est servi par `GET /inscriptions`, dont le contrôleur ne lit que
 * **trois** clés dans la query string : `annee_academique_id`, `classe_id` et
 * `statut`. **La filière n'est pas un filtre serveur** — d'où `serverParams`
 * (ce qu'on envoie) et `filiereId` (ce qu'on applique côté client).
 */
export function useEtudiantFilters() {
  const anneeStore = useAnneeStore();
  const filiereStore = useFiliereStore();
  const classeStore = useClasseStore();

  const anneeId = ref('');
  const filiereId = ref('');
  const classeId = ref('');

  const annees = computed(() => anneeStore.items);
  const filieres = computed(() => filiereStore.items);

  /** Classes de la filière sélectionnée ; toutes si aucune filière n'est choisie. */
  const classes = computed(() => {
    if (!filiereId.value) return classeStore.items;
    return classeStore.items.filter(
      (classe) => String(classe.filiere_id) === String(filiereId.value)
    );
  });

  /**
   * Charge les trois collections de référence. Les stores servent leur cache
   * quand il est chaud : plusieurs onglets peuvent appeler cette fonction sans
   * déclencher de requêtes en double.
   */
  async function loadReferences() {
    await Promise.all([anneeStore.fetchAll(), filiereStore.fetchAll(), classeStore.fetchAll()]);

    if (!anneeId.value) {
      anneeId.value = anneeStore.items.find((annee) => annee.est_active)?.id ?? '';
    }
  }

  // Changer de filière invalide la classe choisie : elle appartenait à l'autre
  // filière et ne figure plus dans la liste proposée.
  watch(filiereId, () => {
    classeId.value = '';
  });

  /** Ce que le backend sait filtrer. */
  const serverParams = computed(() => {
    const query = {};
    if (anneeId.value) query.annee_academique_id = anneeId.value;
    if (classeId.value) query.classe_id = classeId.value;
    return query;
  });

  /** Nom de la filière retenue, pour le filtrage client (les lignes portent `filiere`, pas `filiere_id`). */
  const filiereNom = computed(
    () => filieres.value.find((filiere) => filiere.id === filiereId.value)?.designation ?? ''
  );

  /**
   * Applique le filtre que le serveur ne sait pas appliquer.
   * @param {any[]} rows
   * @returns {any[]}
   */
  function applyClientFilters(rows) {
    if (!filiereNom.value) return rows;
    return rows.filter((row) => row.filiere === filiereNom.value);
  }

  /** Libellés des filtres actifs, pour l'en-tête des exports PDF. */
  const labels = computed(() => ({
    annee: annees.value.find((item) => item.id === anneeId.value)?.code ?? 'Toutes',
    filiere: filiereNom.value || 'Toutes',
    classe: classes.value.find((item) => item.id === classeId.value)?.code ?? 'Toutes',
  }));

  function reset() {
    anneeId.value = '';
    filiereId.value = '';
    classeId.value = '';
  }

  return {
    anneeId,
    filiereId,
    classeId,
    annees,
    filieres,
    classes,
    serverParams,
    filiereNom,
    applyClientFilters,
    labels,
    loadReferences,
    reset,
  };
}
