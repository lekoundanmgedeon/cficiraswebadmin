<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { formatDate } from '@/shared/utils/date';
import { useConcoursStore } from '../store';
import { SEUIL_ADMISSION_DEFAUT, statutConcoursInfo } from '../../constants';

/**
 * Résultats et délibération, vus depuis la liste des concours.
 *
 * Les trois actions par ligne — Rangs, Proclamer, PDF — sont celles de
 * l'original. Trois défauts corrigés :
 *
 * - « Rangs » appelait `fetchMoyennesRangs`, qui répondait **404 « Impossible de
 *   calculer »** — alors que le calcul réussissait. La fonction Postgres est un
 *   `void` et le contrôleur prenait son absence de valeur de retour pour un
 *   échec. Corrigé côté backend.
 * - « Proclamer » n'envoyait **aucun seuil d'admission**, laissant le serveur
 *   appliquer son défaut (10) en silence. Le seuil est désormais demandé.
 * - Les deux passaient par un `confirm()` natif bloquant.
 */

const concoursStore = useConcoursStore();
const { items: concoursList, loading } = storeToRefs(concoursStore);

const searchQuery = ref('');

/** Concours en cours de proclamation, `null` quand la modale est fermée. */
const aProclamer = ref(null);
const seuil = ref(SEUIL_ADMISSION_DEFAUT);

onMounted(() => concoursStore.fetchAll());

const filteredConcours = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return concoursList.value;

  return concoursList.value.filter((concours) =>
    [
      concours.designation,
      concours.libelle_type,
      concours.type_concours,
      concours.code_annee,
      statutConcoursInfo(concours.statut).label,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );
});

/**
 * On ne proclame pas un concours annulé, ni un concours qui n'a pas commencé.
 * (L'ancienne version exposait le bouton sur un `canProclaim` dont la règle
 * n'était écrite nulle part.)
 * @param {string} statut
 */
const canProclaim = (statut) => ['OUVERT', 'CLOTURE'].includes(statutConcoursInfo(statut).code);

const handleCalculerRangs = (id) => concoursStore.recalculer(id);

function openProclamation(concours) {
  aProclamer.value = concours;
  seuil.value = SEUIL_ADMISSION_DEFAUT;
}

async function confirmerProclamation() {
  const result = await concoursStore.proclamer(aProclamer.value.id, {
    seuil_admission: Number(seuil.value),
  });

  if (result !== undefined) aProclamer.value = null;
}

const handleDownloadAdmis = (id) => concoursStore.downloadAdmisList(id, 'pdf');
</script>

<template>
  <section class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
      <div>
        <h4 class="fw-bold text-dark mb-1">Résultats & délibération</h4>
        <p class="text-muted mb-0">
          Calculez les rangs, proclamez les admissions et téléchargez la liste des admis.
        </p>
      </div>

      <div class="input-group input-group-sm" style="max-width: 320px">
        <span class="input-group-text bg-light border-end-0 text-muted">
          <i class="mdi mdi-magnify"></i>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          class="form-control bg-light border-start-0"
          placeholder="Rechercher un concours..."
        />
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr class="text-uppercase small text-muted">
              <th scope="col" class="ps-4">Concours</th>
              <th scope="col">Année</th>
              <th scope="col">Fin</th>
              <th scope="col" class="text-center">Statut</th>
              <th scope="col" class="text-end pe-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="resultat in filteredConcours" :key="resultat.id">
              <td class="ps-4">
                <div class="fw-semibold text-dark">{{ resultat.designation }}</div>
                <div class="text-muted small">
                  {{ resultat.libelle_type || resultat.type_concours || 'Non défini' }}
                </div>
              </td>

              <td>
                <span class="badge rounded-pill bg-light text-secondary border fw-medium px-3 py-2">
                  {{ resultat.code_annee || 'Non renseignée' }}
                </span>
              </td>

              <td class="small text-secondary">{{ formatDate(resultat.date_fin, '—') }}</td>

              <td class="text-center">
                <span
                  class="badge rounded-pill px-3 py-2"
                  :class="`bg-${statutConcoursInfo(resultat.statut).variant}-subtle text-${statutConcoursInfo(resultat.statut).variant}`"
                >
                  {{ statutConcoursInfo(resultat.statut).label }}
                </span>
              </td>

              <td class="text-end pe-4">
                <div
                  class="btn-group btn-group-sm"
                  role="group"
                  aria-label="Actions de délibération"
                >
                  <button
                    type="button"
                    class="btn btn-outline-info d-inline-flex align-items-center gap-1"
                    title="Calculer les moyennes et générer les rangs"
                    :disabled="loading"
                    @click="handleCalculerRangs(resultat.id)"
                  >
                    <i class="mdi mdi-calculator"></i>
                    <span class="d-none d-xl-inline">Rangs</span>
                  </button>

                  <button
                    v-if="canProclaim(resultat.statut)"
                    type="button"
                    class="btn btn-outline-success d-inline-flex align-items-center gap-1"
                    title="Proclamer officiellement les admissions"
                    :disabled="loading"
                    @click="openProclamation(resultat)"
                  >
                    <i class="mdi mdi-bullhorn-outline"></i>
                    <span class="d-none d-xl-inline">Proclamer</span>
                  </button>

                  <button
                    type="button"
                    class="btn btn-outline-danger d-inline-flex align-items-center gap-1"
                    title="Télécharger la liste des admis en PDF"
                    :disabled="loading"
                    @click="handleDownloadAdmis(resultat.id)"
                  >
                    <i class="mdi mdi-file-pdf-box"></i>
                    <span class="d-none d-xl-inline">PDF</span>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredConcours.length === 0">
              <td colspan="5" class="text-center py-5">
                <i class="mdi mdi-folder-search-outline empty-icon"></i>
                <h6 class="fw-semibold text-dark mb-1">Aucun concours trouvé</h6>
                <p class="text-muted mb-0 small">Essayez de modifier votre recherche.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- La proclamation fige les admissions : le seuil est demandé explicitement,
         au lieu d'être laissé au défaut du serveur en silence. -->
    <ConfirmModal
      :model-value="aProclamer !== null"
      title="Proclamer les admissions"
      confirm-label="Proclamer"
      variant="success"
      :loading="loading"
      @update:model-value="aProclamer = null"
      @confirm="confirmerProclamation"
    >
      <p class="mb-3">
        Cette action publie officiellement la liste des admis du concours
        <strong>« {{ aProclamer?.designation }} »</strong>.
      </p>

      <label for="seuil-admission" class="form-label fw-bold small">
        Seuil d'admission <span class="text-danger">*</span>
      </label>
      <div class="input-group">
        <input
          id="seuil-admission"
          v-model.number="seuil"
          type="number"
          class="form-control"
          min="0"
          max="20"
          step="0.25"
        />
        <span class="input-group-text">/ 20</span>
      </div>
      <div class="form-text">
        Les candidats dont la moyenne générale atteint ce seuil sont déclarés admis.
      </div>
    </ConfirmModal>
  </section>
</template>

<style scoped>
.table thead th {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.empty-icon {
  font-size: 2.5rem;
  color: #ced4da;
  display: block;
  margin-bottom: 0.5rem;
}
</style>
