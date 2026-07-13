<script setup>
import { computed, ref, watch } from 'vue';
import { useInscriptionStore } from '../store';
import { DECISIONS, formatMoney, normalizeStatut, statutInfo } from '../constants';

/**
 * Traitement d'un dossier : validation ou rejet.
 *
 * `PaiementDetails.vue` enchaînait `confirm()` natif → `changeStatus` →
 * `alert()` → `fetchInscriptionsFinances()`. Deux boîtes de dialogue bloquantes
 * du navigateur pour une action métier, et un rechargement des finances déclenché
 * depuis le composant alors que le store savait déjà que ses totaux étaient
 * périmés. Le store s'en charge maintenant (`changeStatut`).
 */

const props = defineProps({
  /** Le dossier à traiter, `null` quand la modale est fermée. */
  inscription: { type: Object, default: null },
});

const emit = defineEmits(['update:inscription']);

const store = useInscriptionStore();

const commentaire = ref('');

watch(
  () => props.inscription,
  () => {
    commentaire.value = '';
  }
);

const close = () => emit('update:inscription', null);

const statut = computed(() => statutInfo(props.inscription?.statut));

/** Seul un dossier en attente peut être validé ou rejeté. */
const estEnAttente = computed(() => normalizeStatut(props.inscription?.statut) === 'EN_ATTENTE');

const loading = computed(() => store.loading);

/** @param {string} decision Code de statut cible. */
async function traiter(decision) {
  const result = await store.changeStatut(
    props.inscription.id,
    decision,
    commentaire.value.trim() || null
  );

  if (result !== undefined) close();
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="inscription"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Dossier de {{ inscription.prenom }} {{ inscription.nom }}</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              :disabled="loading"
              aria-label="Fermer"
              @click="close"
            ></button>
          </div>

          <div class="modal-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="badge bg-light text-primary border fw-bold">
                {{ inscription.matricule }}
              </span>
              <span
                class="badge rounded-pill px-3 py-2"
                :class="`bg-${statut.variant}-subtle text-${statut.variant}`"
              >
                {{ statut.label }}
              </span>
            </div>

            <div class="border rounded p-3 mb-3">
              <div class="d-flex justify-content-between py-1">
                <span class="text-muted small">Classe</span>
                <span class="fw-semibold">{{ inscription.classe_code ?? '—' }}</span>
              </div>
              <div class="d-flex justify-content-between py-1">
                <span class="text-muted small">Frais de scolarité</span>
                <span class="fw-semibold">{{ formatMoney(inscription.frais_scolarite) }}</span>
              </div>
              <div class="d-flex justify-content-between py-1">
                <span class="text-muted small">Montant versé</span>
                <span class="fw-semibold text-success">
                  {{ formatMoney(inscription.montant_verse) }}
                </span>
              </div>
              <hr class="my-2" />
              <div class="d-flex justify-content-between py-1">
                <span class="fw-bold">Reste à payer</span>
                <span class="fw-bold text-danger">{{ formatMoney(inscription.reste) }}</span>
              </div>
            </div>

            <div v-if="estEnAttente">
              <label for="paiement-commentaire" class="form-label"> Commentaire de décision </label>
              <textarea
                id="paiement-commentaire"
                v-model="commentaire"
                class="form-control"
                rows="2"
                placeholder="Facultatif — motif du rejet, référence du paiement..."
              ></textarea>
            </div>

            <div v-else class="alert alert-secondary mb-0">
              <i class="mdi mdi-information-outline me-1"></i>
              Ce dossier a déjà été traité. Aucune décision n'est possible.
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" :disabled="loading" @click="close">Fermer</button>

            <button
              v-for="decision in estEnAttente ? DECISIONS : []"
              :key="decision.code"
              class="btn"
              :class="`btn-${decision.variant}`"
              :disabled="loading"
              @click="traiter(decision.code)"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              {{ decision.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
