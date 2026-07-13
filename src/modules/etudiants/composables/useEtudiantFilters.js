import { computed, ref, watch } from 'vue';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useFiliereStore } from '@/modules/structure-academique/filiere/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';

/**
 * Filtres année / filière / classe, en cascade.
 *
 * Le même triplet était réécrit dans quatre fichiers du module (`EtudiantsClasses`,
 * `ExportData`, `ExportEtudiants`, `GenerationRapport`), chacun avec sa propre
 * variante de cascade — et une divergence de comportement à la clé : trois
 * d'entre eux appelaient `classeStore.fetchClassesByFiliere()` à chaque
 * changement de filière, ce qui **écrasait `items` du store des classes**, un
 * état partagé par tout le reste de l'application.
 *
 * Ici, les classes sont chargées **une fois** puis filtrées en mémoire sur
 * `filiere_id`. Les trois collections de référence viennent de stores mis en
 * cache : monter plusieurs onglets qui utilisent ce composable ne coûte aucune
 * requête supplémentaire après la première.
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

  const loading = computed(() => anneeStore.loading || filiereStore.loading || classeStore.loading);

  /**
   * Charge les trois collections de référence. Les stores servent leur cache
   * quand il est chaud, donc appeler cette fonction depuis plusieurs onglets
   * n'entraîne pas de requêtes en double.
   */
  async function loadReferences() {
    await Promise.all([anneeStore.fetchAll(), filiereStore.fetchAll(), classeStore.fetchAll()]);

    // Pré-sélectionne l'année active : c'est celle que l'utilisateur consulte
    // dans la quasi-totalité des cas.
    if (!anneeId.value) {
      anneeId.value = anneeStore.items.find((annee) => annee.est_active)?.id ?? '';
    }
  }

  // Changer de filière invalide la classe choisie : elle appartenait à l'autre
  // filière et ne figure plus dans la liste proposée.
  watch(filiereId, () => {
    classeId.value = '';
  });

  /** Paramètres de requête, limités aux filtres réellement renseignés. */
  const params = computed(() => {
    const query = {};
    if (anneeId.value) query.anneeId = anneeId.value;
    if (filiereId.value) query.filiereId = filiereId.value;
    if (classeId.value) query.classeId = classeId.value;
    return query;
  });

  /** `true` dès qu'au moins un filtre est actif. */
  const hasFilter = computed(() => Object.keys(params.value).length > 0);

  /** Libellés des filtres actifs, pour l'en-tête des exports PDF. */
  const labels = computed(() => ({
    annee: annees.value.find((item) => item.id === anneeId.value)?.code ?? 'Toutes',
    filiere: filieres.value.find((item) => item.id === filiereId.value)?.designation ?? 'Toutes',
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
    loading,
    params,
    hasFilter,
    labels,
    loadReferences,
    reset,
  };
}
