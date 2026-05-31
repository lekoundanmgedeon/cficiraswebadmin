<template>
  <div 
    class="modal fade show d-block" 
    tabindex="-1" 
    style="background: rgba(0,0,0,0.5);"
    @click.self="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg">
        
        <div class="modal-header bg-light border-0 py-3">
          <div class="d-flex align-items-center">
            <div class="avatar-initials me-3 bg-primary text-white fw-bold">
              {{ inscription?.nom?.[0] }}{{ inscription?.prenom?.[0] }}
            </div>
            <div>
              <h5 class="modal-title fw-bold text-dark mb-0">
                Dossier d'inscription
              </h5>
              <small class="text-muted">Réf #{{ inscription?.id }}</small>
            </div>
          </div>
          <button 
            type="button" 
            class="btn-close shadow-none" 
            @click="$emit('close')"
          ></button>
        </div>

        <div class="modal-body p-4">
          <div class="row g-4 mb-4">
            <div class="col-md-6 border-end">
              <h6 class="text-uppercase text-primary fw-bold small mb-3">Profil Étudiant</h6>
              <div class="mb-2">
                <small class="text-muted d-block">Nom complet</small>
                <span class="fw-semibold text-dark">{{ inscription?.prenom }} {{ inscription?.nom }}</span>
              </div>
              <div class="mb-2">
                <small class="text-muted d-block">Matricule</small>
                <span class="badge bg-soft-primary text-primary fw-bold">{{ inscription?.matricule }}</span>
              </div>
            </div>

            <div class="col-md-6 ps-md-4">
              <h6 class="text-uppercase text-primary fw-bold small mb-3">Affectation Académique</h6>
              <div class="mb-2">
                <small class="text-muted d-block">Classe ciblée</small>
                <span class="fw-semibold text-dark">{{ inscription?.classe_code }}</span>
              </div>
              <div class="mb-2">
                <small class="text-muted d-block">Filière</small>
                <span class="text-muted small">{{ inscription?.filiere_code }}</span>
              </div>
            </div>
          </div>

          <hr class="my-4 opacity-25" />

          <h6 class="text-uppercase text-primary fw-bold small mb-3">Situation Financière</h6>
          <div class="row g-3 mb-4 text-center">
            <div class="col-4">
              <div class="bg-light p-3 rounded">
                <small class="text-muted d-block mb-1">Frais Scolarité</small>
                <span class="fw-bold text-dark">{{ formatMoney(inscription?.frais_scolarite) }}</span>
              </div>
            </div>
            <div class="col-4">
              <div class="bg-soft-success p-3 rounded">
                <small class="text-success d-block mb-1">Montant Versé</small>
                <span class="fw-bold text-success">+ {{ formatMoney(inscription?.montant_verse) }}</span>
              </div>
            </div>
            <div class="col-4">
              <div class="bg-soft-danger p-3 rounded">
                <small class="text-danger d-block mb-1">Reste à payer</small>
                <span class="fw-bold text-danger">{{ formatMoney(inscription?.reste) }}</span>
              </div>
            </div>
          </div>

          <hr class="my-4 opacity-25" />

          <div v-if="estEnAttente" class="mb-2">
            <label class="form-label fw-semibold text-dark">
              Commentaire de décision <small class="text-muted">(Optionnel)</small>
            </label>
            <textarea 
              class="form-control border shadow-sm" 
              rows="3" 
              placeholder="Ex: Conditions de paiement acceptées, justificatif manquant..."
              v-model="commentaire"
              :disabled="submitting"
            ></textarea>
          </div>
          
          <div v-else class="bg-light p-3 rounded d-flex align-items-center justify-content-between">
            <div>
              <small class="text-muted d-block">Statut actuel du dossier</small>
              <span class="fw-bold text-uppercase">{{ inscription?.statut }}</span>
            </div>
            <span :class="['badge rounded-pill px-3 py-2', statutClass(inscription?.statut)]">
              Dossier Traité
            </span>
          </div>
        </div>

        <div class="modal-footer bg-light border-0 py-3">
          <button 
            type="button" 
            class="btn btn-white border px-4" 
            @click="$emit('close')"
            :disabled="submitting"
          >
            Fermer
          </button>
          
          <div v-if="estEnAttente" class="d-flex gap-2">
            <button 
              type="button" 
              class="btn btn-outline-danger px-4" 
              @click="traiterDossier('REJETEE')"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Rejeter le dossier
            </button>
            <button 
              type="button" 
              class="btn btn-success px-4 shadow-sm" 
              @click="traiterDossier('VALIDEE')"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Valider l'inscription
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useInscriptionStore } from '@/stores/academiqueStore/inscriptionStore';

const props = defineProps({
  show: { type: Boolean, default: false },
  inscription: { type: Object, required: true }
});

const emit = defineEmits(['close']);
const store = useInscriptionStore();

const commentaire = ref('');
const submitting = ref(false);

// Vérifie si l'inscription est en attente (insensible à la casse)
const estEnAttente = computed(() => {
  return props.inscription?.statut?.toLowerCase() === 'en attente';
});

const traiterDossier = async (nouveauStatut) => {
  const actionText = nouveauStatut === 'VALIDEE' ? 'valider' : 'rejeter';
  if (!confirm(`Confirmez-vous le choix de ${actionText} cette inscription ?`)) return;

  submitting.value = true;
  try {
    // Envoi au store Pinia (qui appelle l'API PATCH /:id/statut)
    await store.changeStatus(props.inscription.id, {
      statut: nouveauStatut,
      commentaire: commentaire.value.trim() || null
    });
    
    alert(`Le dossier a été mis à jour avec le statut : ${nouveauStatut}`);
    
    // Forcer la synchronisation globale des données financières en arrière-plan
    await store.fetchInscriptionsFinances();
    
    emit('close');
  } catch (error) {
    console.error('Erreur lors du traitement du dossier:', error);
    alert('Une erreur est survenue lors de la mise à jour.');
  } finally {
    submitting.value = false;
  }
};

const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

const statutClass = (statut) => {
  const s = statut?.toLowerCase();
  return {
    'bg-success text-white': s === 'validée' || s === 'validee' || s === 'active',
    'bg-warning text-dark': s === 'en attente',
    'bg-danger text-white': s === 'annulée' || s === 'annulee' || s === 'rejetee',
  };
};
</script>

<style scoped>
.avatar-initials {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.bg-soft-primary {
  background-color: rgba(13, 110, 253, 0.1);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.1);
}
.bg-soft-success {
  background-color: rgba(25, 135, 84, 0.1);
}
</style>