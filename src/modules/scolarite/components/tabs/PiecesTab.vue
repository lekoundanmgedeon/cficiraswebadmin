<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ItemActions from '@/shared/components/ItemActions.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import Pagination from '@/components/shared/Pagination.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { openModal } from '@/shared/utils/modal';
import { formatDate } from '@/shared/utils/date';
import { useDossierStore } from '../../store';
import { PIECE_MODAL_ID, pieceInfo, typePieceLabel } from '../../constants';
import AjoutPieceModal from '../AjoutPieceModal.vue';

/**
 * Pièces justificatives du dossier.
 *
 * `DocumentsArchives.vue` servait des `categories` et des `documents` codés en
 * dur. Les pièces viennent maintenant de `GET /etudiants/:id/complet`, et les
 * deux endpoints qui les pilotent — dépôt et vérification — existaient sans que
 * la moindre vue les appelle.
 *
 * Le **rejet exige un motif** : le serveur répond 400 sans lui (« Le motif de
 * rejet est obligatoire pour corriger le dossier »). D'où la modale dédiée,
 * plutôt qu'une simple confirmation.
 */

const dossierStore = useDossierStore();
const { pieces, piecesEnAttente, loading } = storeToRefs(dossierStore);

/** Pièce en cours de rejet, `null` quand la modale est fermée. */
const pieceARejeter = ref(null);
const motifRejet = ref('');
const motifErreur = ref('');

const openAjout = () => openModal(PIECE_MODAL_ID);

/** @param {any} piece */
function actionsFor(piece) {
  const statut = pieceInfo(piece.statut).code;
  const enAttente = statut === 'EN_ATTENTE';

  return [
    {
      key: 'valider',
      label: 'Valider la pièce',
      icon: 'mdi-check-circle-outline',
      hidden: !enAttente,
      confirm: {
        title: 'Valider la pièce',
        confirmLabel: 'Valider',
        variant: 'success',
      },
    },
    {
      key: 'rejeter',
      label: 'Rejeter la pièce',
      icon: 'mdi-close-circle-outline',
      variant: 'danger',
      hidden: !enAttente,
    },
  ];
}

/** @param {{key: string, item: any}} event */
function onAction({ key, item }) {
  if (key === 'valider') {
    dossierStore.verifyPiece(item.id, 'VALIDE');
    return;
  }

  if (key === 'rejeter') {
    // Pas de confirmation simple : le serveur exige un motif.
    pieceARejeter.value = item;
    motifRejet.value = '';
    motifErreur.value = '';
  }
}

function closeRejet() {
  pieceARejeter.value = null;
  motifRejet.value = '';
  motifErreur.value = '';
}

async function confirmerRejet() {
  if (!motifRejet.value.trim()) {
    motifErreur.value = 'Le motif est obligatoire : il indique à l’étudiant quoi corriger.';
    return;
  }

  const result = await dossierStore.verifyPiece(
    pieceARejeter.value.id,
    'REJETE',
    motifRejet.value.trim()
  );

  if (result !== undefined) closeRejet();
}

const aucunePiece = computed(() => pieces.value.length === 0);

const { page, itemsPerPage, paginated } = usePagination(pieces, { perPage: 10 });
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h5 class="fw-bold mb-1">Pièces justificatives</h5>
        <p class="text-muted small mb-0">
          <b>{{ pieces.length }}</b> pièce(s) au dossier · <b>{{ piecesEnAttente.length }}</b> en
          attente de vérification.
        </p>
      </div>

      <button class="btn btn-primary" @click="openAjout">
        <i class="mdi mdi-file-plus-outline me-1"></i> Déposer une pièce
      </button>
    </div>

    <EmptyState
      v-if="aucunePiece"
      title="Aucune pièce"
      description="Aucune pièce justificative n'a encore été déposée pour ce dossier."
    />

    <div v-else class="card border-0 shadow-sm overflow-hidden">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-4 py-3">Type de pièce</th>
                <th>Fichier</th>
                <th>Déposée le</th>
                <th class="text-center">Statut</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="piece in paginated" :key="piece.id">
                <td class="ps-4 fw-semibold text-dark">
                  {{ typePieceLabel(piece.type_piece) }}
                </td>

                <td>
                  <code class="small">{{ piece.chemin ?? '—' }}</code>
                </td>

                <td class="small text-muted">{{ formatDate(piece.date_depot) }}</td>

                <td class="text-center">
                  <span
                    class="badge rounded-pill px-3 py-2"
                    :class="`bg-${pieceInfo(piece.statut).variant}-subtle text-${pieceInfo(piece.statut).variant}`"
                  >
                    {{ pieceInfo(piece.statut).label }}
                  </span>

                  <div v-if="piece.motif_rejet" class="small text-danger mt-1">
                    {{ piece.motif_rejet }}
                  </div>
                </td>

                <td class="text-end pe-4">
                  <ItemActions
                    v-if="pieceInfo(piece.statut).code === 'EN_ATTENTE'"
                    :item="piece"
                    :label="typePieceLabel(piece.type_piece)"
                    :actions="actionsFor(piece)"
                    :loading="loading"
                    @action="onAction"
                  />
                  <span v-else class="text-muted small">Traitée</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-footer bg-white border-0 py-3 px-4">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="pieces.length"
        />
      </div>
    </div>

    <AjoutPieceModal />

    <!-- Rejet : le motif est exigé par le serveur, une simple confirmation ne suffit pas. -->
    <Teleport to="body">
      <div
        v-if="pieceARejeter"
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        style="background-color: rgba(0, 0, 0, 0.5)"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">Rejeter la pièce</h5>
              <button
                type="button"
                class="btn-close btn-close-white"
                :disabled="loading"
                aria-label="Fermer"
                @click="closeRejet"
              ></button>
            </div>

            <form @submit.prevent="confirmerRejet">
              <div class="modal-body">
                <p class="mb-3">
                  Rejeter la pièce
                  <strong>« {{ typePieceLabel(pieceARejeter.type_piece) }} »</strong> ?
                </p>

                <label for="motif-rejet" class="form-label">
                  Motif du rejet <span class="text-danger">*</span>
                </label>
                <textarea
                  id="motif-rejet"
                  v-model="motifRejet"
                  class="form-control"
                  :class="{ 'is-invalid': motifErreur }"
                  rows="3"
                  placeholder="Ex : document illisible, page manquante..."
                ></textarea>
                <div class="form-text">
                  Le motif est transmis à l'étudiant pour qu'il sache quoi corriger.
                </div>

                <div v-if="motifErreur" class="invalid-feedback d-block">{{ motifErreur }}</div>
              </div>

              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  :disabled="loading"
                  @click="closeRejet"
                >
                  Annuler
                </button>
                <button type="submit" class="btn btn-danger" :disabled="loading">
                  <span
                    v-if="loading"
                    class="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>
                  {{ loading ? 'Rejet...' : 'Rejeter la pièce' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.table thead th {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #5c677d;
  border-bottom: 1px solid #e2e8f0;
}
</style>
