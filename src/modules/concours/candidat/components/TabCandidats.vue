<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import * as XLSX from 'xlsx';
import Pagination from '@/components/shared/Pagination.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { formatDate } from '@/shared/utils/date';
import { useCandidatStore } from '../store';
import { useEpreuveConcoursStore } from '../../epreuve/store';
import CandidatDossierModal from './CandidatDossierModal.vue';
import { IMPORT_ACCEPT, sexeLabel, statutDossierInfo, STATUT_DOSSIER_LIST } from '../../constants';

const props = defineProps({
  concoursId: { type: String, required: true },
});

/**
 * Candidatures d'un concours : import par lot et consultation.
 *
 * La mise en page — modèle Excel, zone d'import, tableau paginé — est celle de
 * l'original. Deux défauts corrigés :
 *
 * - L'import appelait `POST /candidats/import`, **une route commentée côté
 *   backend** : il répondait 404 alors que son contrôleur était bien
 *   implémenté. La route a été rétablie.
 * - Le bouton « Supprimer » ne supprimait **rien** : il retirait la ligne du
 *   tableau local et annonçait « Candidat masqué de la liste locale ». Elle
 *   réapparaissait au rechargement. Et pour cause — **il n'existe aucun
 *   `DELETE /candidats/:id`**. Le bouton a été retiré plutôt que laissé à
 *   mentir.
 */

const candidatStore = useCandidatStore();
const epreuveStore = useEpreuveConcoursStore();
const notifications = useNotificationStore();

const { items: candidats, loading } = storeToRefs(candidatStore);

const fileInput = ref(null);
const selectedFile = ref(null);
const dernierImport = ref('');

const recherche = ref('');
const filtreStatut = ref('');
/** Candidat dont le dossier est ouvert, `null` quand la modale est fermée. */
const candidatConsulte = ref(null);

onMounted(() => {
  candidatStore.fetchByConcours(props.concoursId);
  // Les épreuves servent au dossier (une note par épreuve) ; elles sont
  // partagées avec les autres onglets et ne coûtent qu'une requête.
  epreuveStore.fetchByConcours(props.concoursId);
});

watch(
  () => props.concoursId,
  (id) => {
    candidatStore.fetchByConcours(id);
    epreuveStore.fetchByConcours(id);
  }
);

/**
 * Normalisation de recherche : minuscules, **accents retirés**.
 *
 * Sans cela, « NGuema » ne trouve pas « N'Guéma » et « prenom » ne trouve pas
 * « Prénom » — ce qui est précisément ce qu'on tape dans une barre de recherche.
 * `NFD` décompose les caractères accentués, et la plage `̀-ͯ` retire
 * les diacritiques ainsi isolés. Elle est écrite en échappements plutôt qu'en
 * caractères littéraux : des marques combinantes dans le source sont invisibles
 * à la relecture, et un éditeur peut les normaliser en silence.
 *
 * @param {any} valeur
 */
const normaliser = (valeur) =>
  String(valeur ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Les champs sur lesquels porte la recherche, concaténés une fois par candidat. */
const indexRecherche = (candidat) =>
  normaliser(
    [
      candidat.num_table,
      candidat.nom,
      candidat.prenom,
      candidat.email,
      candidat.tel,
      candidat.lieunais,
      candidat.ville,
      candidat.nationalite,
      sexeLabel(candidat.sexe),
      statutDossierInfo(candidat.statut_dossier).label,
    ].join(' ')
  );

/**
 * Recherche multi-termes : chaque mot saisi doit se retrouver quelque part dans
 * la fiche, dans n'importe quel ordre. « diallo t-2026 » trouve donc le
 * candidat DIALLO portant un numéro de table commençant par T-2026, ce qu'une
 * recherche sur une seule chaîne continue manquerait.
 */
const candidatsFiltres = computed(() => {
  const termes = normaliser(recherche.value).split(/\s+/).filter(Boolean);

  return candidats.value.filter((candidat) => {
    const statut = statutDossierInfo(candidat.statut_dossier).code;
    if (filtreStatut.value && statut !== filtreStatut.value) return false;
    if (termes.length === 0) return true;

    const index = indexRecherche(candidat);
    return termes.every((terme) => index.includes(terme));
  });
});

const {
  page,
  itemsPerPage,
  startIndex,
  paginated: paginatedCandidats,
} = usePagination(candidatsFiltres, {
  perPage: 10,
  resetKey: () => [recherche.value, filtreStatut.value, props.concoursId],
});

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    candidatsFiltres.value.map((candidat, index) => ({
      'N°': index + 1,
      'N° table': candidat.num_table,
      Nom: candidat.nom,
      Prénom: candidat.prenom,
      Sexe: sexeLabel(candidat.sexe),
      Naissance: formatDate(candidat.datenais, '—'),
      'Lieu de naissance': candidat.lieunais ?? '—',
      Nationalité: candidat.nationalite ?? '—',
      Courriel: candidat.email ?? '—',
      Téléphone: candidat.tel ?? '—',
      Ville: candidat.ville ?? '—',
      Dossier: statutDossierInfo(candidat.statut_dossier).label,
      'Inscrit le': formatDate(candidat.date_inscription, '—'),
    }))
  ),
  title: 'Liste des candidats',
  fileBaseName: 'candidats_concours',
  filters: () => [
    { label: 'Recherche', value: recherche.value || '—' },
    {
      label: 'Dossier',
      value:
        STATUT_DOSSIER_LIST.find((statut) => statut.code === filtreStatut.value)?.label ?? 'Tous',
    },
    { label: 'Candidats', value: candidatsFiltres.value.length },
    { label: "Date d'édition", value: new Date().toLocaleDateString('fr-FR') },
  ],
});

const triggerFileSelect = () => fileInput.value?.click();

function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const accepted = IMPORT_ACCEPT.split(',').some((extension) =>
    file.name.toLowerCase().endsWith(extension)
  );

  if (!accepted) {
    notifications.notifyError(`Format non pris en charge. Attendu : ${IMPORT_ACCEPT}.`);
    return;
  }

  selectedFile.value = file;
}

function cancelSelection() {
  selectedFile.value = null;
  // Sans cette remise à zéro, resélectionner le même fichier n'émettrait pas
  // d'événement `change` et le formulaire paraîtrait figé.
  if (fileInput.value) fileInput.value.value = '';
}

async function uploadFile() {
  if (!selectedFile.value) return;

  const result = await candidatStore.importCandidatsFile(selectedFile.value, props.concoursId);

  // `run()` renvoie `undefined` sur échec : on ne réinitialise que si ça a marché.
  if (result === undefined) return;

  cancelSelection();
  page.value = 1;

  dernierImport.value = new Date().toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Modèle Excel.
 *
 * Les colonnes sont celles que la base exige, avec leurs contraintes :
 * `sexe` ∈ {M, F}, `email` et `tel` validés par expression régulière.
 */
function downloadTemplate() {
  const exemple = {
    nom: 'KABONGO',
    prenom: 'Marc',
    sexe: 'M',
    datenais: '2002-05-14',
    lieunais: 'Conakry',
    tel: '+224620000000',
    email: 'marc.kabongo@exemple.com',
    num_table: 'TAB-2026-0001',
  };

  const worksheet = XLSX.utils.json_to_sheet([exemple]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidats');
  XLSX.writeFile(workbook, 'modele_candidats.xlsx');
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h5 class="fw-bold mb-1 text-dark">Candidatures</h5>
        <p class="text-muted small mb-0">Importez la liste des candidats inscrits à ce concours.</p>
      </div>

      <div class="d-flex gap-2">
        <ExportMenu
          label="Exporter la liste"
          :disabled="candidatsFiltres.length === 0"
          @excel="exportToExcel"
          @pdf="exportToPdf"
        />
        <button class="btn btn-sm btn-light border text-secondary" @click="downloadTemplate">
          <i class="bi bi-file-earmark-excel me-1"></i> Modèle Excel
        </button>
      </div>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <a href="#" class="btn btn-outline-primary btn-sm" @click.prevent="triggerFileSelect">
              <i class="bi bi-cloud-arrow-up me-1"></i> Sélectionner un fichier
            </a>
            <small class="text-muted ms-2">Formats acceptés : {{ IMPORT_ACCEPT }}</small>

            <input
              ref="fileInput"
              type="file"
              hidden
              :accept="IMPORT_ACCEPT"
              @change="handleFileChange"
            />
          </div>

          <div v-if="selectedFile" class="d-flex align-items-center gap-2">
            <span class="badge bg-light text-dark border">
              <i class="bi bi-filetype-xlsx text-success me-1"></i>{{ selectedFile.name }}
            </span>
            <button class="btn btn-sm btn-primary" :disabled="loading" @click="uploadFile">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-1"
                aria-hidden="true"
              ></span>
              {{ loading ? 'Import...' : "Lancer l'import" }}
            </button>
            <button
              class="btn btn-sm btn-light border"
              :disabled="loading"
              @click="cancelSelection"
            >
              Annuler
            </button>
          </div>

          <small v-else-if="dernierImport" class="text-muted">
            Dernier import : {{ dernierImport }}
          </small>
        </div>
      </div>
    </div>

    <!-- Recherche intelligente : plusieurs mots, dans n'importe quel ordre, sans
         se soucier des accents ni de la casse. -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body py-3">
        <div class="row g-2 align-items-center">
          <div class="col-md-6">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white border-end-0 text-muted">
                <i class="bi bi-search"></i>
              </span>
              <input
                v-model="recherche"
                type="search"
                class="form-control border-start-0 ps-0"
                placeholder="Nom, prénom, n° table, courriel, téléphone, ville…"
              />
              <button
                v-if="recherche"
                class="btn btn-outline-secondary"
                type="button"
                title="Effacer la recherche"
                @click="recherche = ''"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="col-md-3">
            <select v-model="filtreStatut" class="form-select form-select-sm">
              <option value="">Tous les dossiers</option>
              <option v-for="statut in STATUT_DOSSIER_LIST" :key="statut.code" :value="statut.code">
                {{ statut.label }}
              </option>
              <option value="ABSENT">Non déposé</option>
            </select>
          </div>

          <div class="col-md-3 text-md-end">
            <span class="text-muted small">
              <strong>{{ candidatsFiltres.length }}</strong> candidat(s)
              <template v-if="candidatsFiltres.length !== candidats.length">
                sur {{ candidats.length }}
              </template>
            </span>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading && candidats.length === 0" />

    <div v-else class="table-responsive border rounded-3 shadow-sm bg-white">
      <table class="table table-hover align-middle mb-0 text-sm">
        <thead class="table-light text-uppercase text-xs text-muted">
          <tr>
            <th class="ps-3" style="width: 60px">#</th>
            <th>N° table</th>
            <th>Candidat</th>
            <th class="text-center">Sexe</th>
            <th>Naissance</th>
            <th>Contact</th>
            <th class="text-center">Dossier</th>
            <th class="text-end pe-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(candidat, index) in paginatedCandidats" :key="candidat.id">
            <td class="ps-3 text-muted small">{{ startIndex + index + 1 }}</td>

            <td>
              <span class="font-monospace fw-bold text-secondary">{{ candidat.num_table }}</span>
            </td>

            <td>
              <div class="fw-semibold text-dark">{{ candidat.nom }} {{ candidat.prenom }}</div>
            </td>

            <td class="text-center">
              <span class="badge bg-light text-dark border">
                {{ sexeLabel(candidat.sexe) }}
              </span>
            </td>

            <td class="small text-muted">
              {{ formatDate(candidat.datenais, '—') }}
              <div v-if="candidat.lieunais" class="text-muted">{{ candidat.lieunais }}</div>
            </td>

            <td class="small">
              <div>{{ candidat.email ?? '—' }}</div>
              <div class="text-muted">{{ candidat.tel ?? '—' }}</div>
            </td>

            <td class="text-center">
              <span
                class="badge rounded-pill px-2 py-1"
                :class="`bg-${statutDossierInfo(candidat.statut_dossier).variant}-subtle text-${statutDossierInfo(candidat.statut_dossier).variant}`"
              >
                {{ statutDossierInfo(candidat.statut_dossier).label }}
              </span>
            </td>

            <td class="text-end pe-3">
              <button
                class="btn btn-sm btn-outline-primary"
                title="Voir le dossier complet du candidat"
                @click="candidatConsulte = candidat"
              >
                <i class="bi bi-eye me-1"></i> Détails
              </button>
            </td>
          </tr>

          <tr v-if="candidats.length === 0">
            <td colspan="8" class="text-center py-5 text-muted">
              <i class="bi bi-people d-block mb-2 fs-3"></i>
              Aucun candidat n'est encore inscrit à ce concours.
            </td>
          </tr>

          <tr v-else-if="candidatsFiltres.length === 0">
            <td colspan="8" class="text-center py-5 text-muted">
              <i class="bi bi-search d-block mb-2 fs-3"></i>
              Aucun candidat ne correspond à cette recherche.
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="candidatsFiltres.length > 0" class="card-footer bg-white border-top py-3">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="candidatsFiltres.length"
        />
      </div>
    </div>

    <CandidatDossierModal
      :candidat="candidatConsulte"
      :concours-id="concoursId"
      @close="candidatConsulte = null"
    />
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 0.72rem;
}
.text-sm {
  font-size: 0.875rem;
}
</style>
