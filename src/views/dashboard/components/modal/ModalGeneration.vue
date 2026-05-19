<template>
  <!-- Modal Principal (Id unique pour l'appel Bootstrap) -->
  <div 
    class="modal fade" 
    id="modalGenerationRapport" 
    tabindex="-1" 
    aria-labelledby="modalRapportLabel" 
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-md">
      <div class="modal-content border-0 shadow rounded-4 overflow-hidden">
        
        <!-- En-tête du Modal -->
        <div class="modal-header bg-light border-bottom px-4 py-3">
          <div class="d-flex align-items-center">
            <div class="p-2 bg-soft-primary rounded text-primary me-2 line-height-1">
              <i class="bi bi-file-earmark-bar-graph-fill fs-5"></i>
            </div>
            <div>
              <h6 class="modal-title fw-bold text-dark text-uppercase small tracking-wider mb-0" id="modalRapportLabel">
                Générer un Rapport d'Audit
              </h6>
              <small class="text-muted text-xs">Extraction consolidée des données du tableau de bord</small>
            </div>
          </div>
          <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <!-- Corps du Modal (Formulaire de configuration) -->
        <div class="modal-body p-4">
          <form @submit.prevent="traiterExtraction">
            
            <!-- 1. Sélection du Type de Rapport -->
            <div class="mb-3">
              <label class="form-label text-xs fw-bold text-secondary text-uppercase mb-1">Périmètre Analytique</label>
              <select v-model="form.type" class="form-select text-xs shadow-none bg-light border" required>
                <option value="global">Vue d'ensemble Complète (Santé Institutionnelle)</option>
                <option value="scolarite">Scolarités & Restes à Recouvrer (Financier)</option>
                <option value="pedagogie">Pédagogie & Honoraires Vacations (Charges)</option>
                <option value="cycles">Cycles & Taux de Rétention (Cohortes)</option>
              </select>
            </div>

            <!-- 2. Sélection de la Période (Filtre Temporel) -->
            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-secondary text-uppercase mb-1">Date de début</label>
                <input type="date" v-model="form.dateDebut" class="form-control text-xs shadow-none bg-light border" required />
              </div>
              <div class="col-md-6">
                <label class="form-label text-xs fw-bold text-secondary text-uppercase mb-1">Date de fin</label>
                <input type="date" v-model="form.dateFin" class="form-control text-xs shadow-none bg-light border" required />
              </div>
            </div>

            <!-- 3. Options Additionnelles (Cases à cocher) -->
            <div class="mb-4">
              <label class="form-label text-xs fw-bold text-secondary text-uppercase mb-2">Options d'affichage</label>
              
              <!-- Section Centrée des Options d'Affichage -->
                <div class="mb-4 d-flex flex-column align-items-center text-center">              
                <!-- Conteneur intermédiaire pour garder les cases alignées à gauche entre elles -->
                <div class="text-start" style="max-width: 90%;">
                    <div class="form-check mb-2">
                    <input class="form-check-input shadow-none" type="checkbox" id="checkIA" v-model="form.inclureIA" />
                    <label class="form-check-label text-xs text-dark cursor-pointer" for="checkIA">
                        Inclure les diagnostics du Copilote IA
                    </label>
                    </div>
                    
                    <div class="form-check mb-1">
                    <input class="form-check-input shadow-none" type="checkbox" id="checkAnonyme" v-model="form.anonymiser" />
                    <label class="form-check-label text-xs text-dark cursor-pointer" for="checkAnonyme">
                        Anonymiser les fiches nominatives d'étudiants (Audit Externe)
                    </label>
                    </div>
                </div>
                </div>
            </div>

            <!-- 4. Choix du Format de Sortie -->
            <div class="mb-4 p-3 bg-light rounded">
              <label class="form-label text-xs fw-bold text-secondary text-uppercase d-block mb-2">Format de téléchargement</label>
              <div class="d-flex gap-3">
                <div class="form-check flex-fill p-2 bg-white rounded border text-center">
                  <input class="form-check-input d-none" type="radio" name="format" id="formatPdf" value="pdf" v-model="form.format" />
                  <label class="form-check-label d-block text-xs fw-bold cursor-pointer" :class="form.format === 'pdf' ? 'text-danger' : 'text-muted'" for="formatPdf">
                    <i class="bi bi-file-earmark-pdf-fill fs-5 d-block mb-1 text-danger"></i> Document PDF (.pdf)
                  </label>
                </div>
                <div class="form-check flex-fill p-2 bg-white rounded border text-center">
                  <input class="form-check-input d-none" type="radio" name="format" id="formatExcel" value="excel" v-model="form.format" />
                  <label class="form-check-label d-block text-xs fw-bold cursor-pointer" :class="form.format === 'excel' ? 'text-success' : 'text-muted'" for="formatExcel">
                    <i class="bi bi-file-earmark-excel-fill fs-5 d-block mb-1 text-success"></i> Tableur Excel (.xlsx)
                  </label>
                </div>
              </div>
            </div>

            <!-- Actions de validation de pied de page -->
            <div class="d-flex gap-2 justify-content-end pt-2 border-top border-light">
              <button type="button" class="btn btn-sm btn-light border text-xs px-3" data-bs-dismiss="modal">
                Annuler
              </button>
              <button type="submit" class="btn btn-sm btn-primary text-xs px-4" :disabled="enCours">
                <span v-if="enCours" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-cloud-arrow-down-fill me-1"></i> Lancer l'extraction
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const enCours = ref(false);

// Structure réactive par défaut du formulaire de rapport
const form = ref({
  type: 'global',
  dateDebut: '2026-01-01',
  dateFin: '2026-05-19',
  inclureIA: true,
  anonymiser: false,
  format: 'pdf'
});

// Traitement de l'envoi de la demande comptable
const traiterExtraction = () => {
  enCours.value = true;
  
  // Simulation de compilation serveur du rapport ERP
  setTimeout(() => {
    enCours.value = false;
    alert(
      `Extraction ERP Confirmée !\n\n` +
      `• Type : ${form.value.type.toUpperCase()}\n` +
      `• Période : Du ${form.value.dateDebut} au ${form.value.dateFin}\n` +
      `• Format : ${form.value.format.toUpperCase()}\n` +
      `• Option IA : ${form.value.inclureIA ? 'Oui' : 'Non'}\n\n` +
      `Le fichier a été généré avec succès par le noyau de l'ERP.`
    );
    
    // Fermeture manuelle optionnelle via Bootstrap ou traitement de téléchargement réel ici
  }, 1500);
};
</script>

<style scoped>
.bg-soft-primary { background-color: rgba(0, 123, 255, 0.08); }
.text-xs { font-size: 11px !important; }
.tracking-wider { letter-spacing: 0.5px; }
.line-height-1 { line-height: 1; }
.cursor-pointer { cursor: pointer; }

/* Styles pour transformer les radios en boutons de choix de formats épurés */
.form-check-input:checked + .form-check-label {
  font-weight: 700 !important;
}
.form-check:has(.form-check-input:checked) {
  border-color: #007bff !important;
  background-color: rgba(0, 123, 255, 0.02) !important;
}

/* Alignement strict de la charte ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-control, .form-select {
  border-radius: 0.15rem;
}
</style>