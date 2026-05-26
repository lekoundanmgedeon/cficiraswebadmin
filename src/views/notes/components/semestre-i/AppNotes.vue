<template>
  <div class="modal fade" id="addNotesModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <!-- Header -->
        <div class="modal-header bg-soft-primary">
          <h5 class="modal-title">
            <i class="mdi mdi-note-plus-outline me-2"></i> Ajouter une note
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Fermer"
          ></button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <form @submit.prevent="submitNote">
            <!-- Étudiant -->
            <div class="mb-3">
              <label for="student" class="form-label">Étudiant</label>
              <select v-model="note.etudiant" id="student" class="form-select" required>
                <option disabled value="">Sélectionner un étudiant</option>
                <option v-for="etudiant in etudiants" :key="etudiant.id" :value="etudiant.id">
                  {{ etudiant.nom }} {{ etudiant.prenom }}
                </option>
              </select>
            </div>

            <!-- Module -->
            <div class="mb-3">
              <label for="module" class="form-label">Module</label>
              <select v-model="note.module" id="module" class="form-select" required>
                <option disabled value="">Sélectionner un module</option>
                <option v-for="module in modules" :key="module.id" :value="module.id">
                  {{ module.intitule }}
                </option>
              </select>
            </div>

            <!-- Type d'évaluation -->
            <div class="mb-3">
              <label for="type" class="form-label">Type d'évaluation</label>
              <select v-model="note.type" id="type" class="form-select" required>
                <option value="devoir">Devoir</option>
                <option value="session">Session ordinaire</option>
                <option value="rappel">Session de rappel</option>
              </select>
            </div>

            <!-- Semestre -->
            <div class="mb-3">
              <label for="semestre" class="form-label">Semestre</label>
              <select v-model="note.semestre" id="semestre" class="form-select" required>
                <option value="I">Semestre I</option>
                <option value="II">Semestre II</option>
              </select>
            </div>

            <!-- Note -->
            <div class="mb-3">
              <label for="valeur" class="form-label">Note</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                v-model="note.valeur"
                id="valeur"
                class="form-control"
                placeholder="Ex: 15.5"
                required
              />
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button type="button" class="btn btn-light" data-bs-dismiss="modal">Annuler</button>
          <button type="button" class="btn btn-primary" @click="submitNote">
            <i class="mdi mdi-content-save-outline me-1"></i> Enregistrer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const etudiants = ref([
  { id: 1, nom: 'Diop', prenom: 'Awa' },
  { id: 2, nom: 'Ndiaye', prenom: 'Moussa' },
]);

const modules = ref([
  { id: 1, intitule: 'Mathématiques' },
  { id: 2, intitule: 'Physique' },
]);

const note = ref({
  etudiant: '',
  module: '',
  type: '',
  semestre: '',
  valeur: null,
});

const submitNote = () => {
  console.log('Note ajoutée :', note.value);
  // TODO: envoyer vers API ou store Pinia
};
</script>
