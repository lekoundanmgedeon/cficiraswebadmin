import { computed, ref } from 'vue';
import { useFiliereStore } from '@/modules/structure-academique/filiere/store';
import { DOSSIER_STATUT_LIST, dossierInfo } from '@/modules/scolarite/constants';

/**
 * Filtres du répertoire des étudiants.
 *
 * Le triplet année/filière/classe était recopié dans quatre fichiers du module,
 * chacun avec sa variante — et trois d'entre eux appelaient
 * `classeStore.fetchClassesByFiliere()` à chaque changement de filière, ce qui
 * **écrasait `items` du store des classes**, un état partagé par toute
 * l'application.
 *
 * ⚠️ Ce composable ne propose **ni année ni classe**, et ce n'est pas un oubli :
 * `GET /etudiants` ne les renvoie pas et ne sait pas filtrer dessus. Un étudiant
 * appartient à une **filière** ; sa **classe** vient de son **inscription**.
 * L'onglet « Par classe » interroge donc les inscriptions, pas l'annuaire.
 *
 * Ce que `listerEtudiants` lit réellement dans la query string :
 * `search`, `filiere_id`, `statut_dossier`.
 */
export function useEtudiantFilters() {
  const filiereStore = useFiliereStore();

  const search = ref('');
  const filiereId = ref('');
  const statutDossier = ref('');

  const filieres = computed(() => filiereStore.items);
  const statuts = DOSSIER_STATUT_LIST;

  /** Charge les filières. Le store sert son cache quand il est chaud. */
  const loadReferences = () => filiereStore.fetchAll();

  /** Les trois filtres que le serveur sait appliquer. */
  const serverParams = computed(() => {
    const query = {};
    if (search.value.trim()) query.search = search.value.trim();
    if (filiereId.value) query.filiere_id = filiereId.value;
    if (statutDossier.value) query.statut_dossier = statutDossier.value;
    return query;
  });

  /** Libellés des filtres actifs, pour l'en-tête des exports PDF. */
  const labels = computed(() => ({
    filiere:
      filieres.value.find((filiere) => filiere.id === filiereId.value)?.designation ?? 'Toutes',
    statut: statutDossier.value ? dossierInfo(statutDossier.value).label : 'Tous',
    recherche: search.value.trim() || '—',
  }));

  function reset() {
    search.value = '';
    filiereId.value = '';
    statutDossier.value = '';
  }

  return {
    search,
    filiereId,
    statutDossier,
    filieres,
    statuts,
    serverParams,
    labels,
    loadReferences,
    reset,
  };
}
