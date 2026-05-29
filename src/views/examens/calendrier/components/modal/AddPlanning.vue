<template>
  <div
    class="modal fade"
    id="addPlanningModal"
    tabindex="-1"
    aria-labelledby="addPlanningModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title" id="addPlanningModalLabel">Ajouter un examen</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitPlanning">
            <!-- Description -->
            <div class="mb-3">
              <label class="form-label">Description</label>
              <input
                type="text"
                class="form-control"
                placeholder="PLANNIFICATION-INFO-S1"
                v-model="planification.description"
                required
              />
            </div>
            <!-- Sélection de l'examen -->
            <div class="mb-3">
              <label class="form-label">Nom de l'examen</label>
              <select class="form-select" v-model="selectedExamId" @change="onSelectExam" required>
                <option value="" disabled>Choisir un examen</option>
                <option v-for="ex in examens" :key="ex.session_id" :value="ex.session_id">
                  {{ ex.nom_session }}
                </option>
              </select>
            </div>

            <!-- Champs affichés automatiquement -->
            <div class="mb-3">
              <label class="form-label">Type</label>
              <input type="text" class="form-control" v-model="examen.type_session" readonly />
            </div>

            <!-- Date de début -->
            <div class="mb-3">
              <label class="form-label">Date de début</label>
              <input type="date" class="form-control" v-model="planification.date_debut" required />
            </div>

            <!-- Date de fin -->
            <div class="mb-3">
              <label class="form-label">Date de fin</label>
              <input type="date" class="form-control" v-model="planification.date_fin" required />
            </div>

            <!-- Statut -->
            <div class="mb-3">
              <label class="form-label">Statut</label>
              <select class="form-select" v-model="planification.statut" required>
                <option value="">Choisir un statut</option>
                <option value="Prévu">Prévu</option>
                <option value="Terminé">Terminé</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>

            <!-- Filière -->
            <div class="mb-3">
              <label class="form-label">Filière</label>
              <select class="form-select" v-model="planification.filiere_id" required>
                <option value="" disabled>Choisir une filière</option>
                <!-- Remplace les options par tes données -->
                <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
                  {{ filiere.nom }}
                </option>
              </select>
            </div>

            <!-- Année académique -->
            <div class="mb-3">
              <label class="form-label">Année académique</label>
              <select class="form-select" v-model="planification.annee_id" required>
                <option value="" disabled>Choisir une année</option>
                <!-- Remplace les options par tes données -->
                <option v-for="annee in annees" :key="annee.id" :value="annee.id">
                  {{ annee.nom }}
                </option>
              </select>
            </div>

            <button type="submit" class="btn btn-success">Ajouter</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue';

const emit = defineEmits(['examen-ajoute']);

import { getSessions } from '@/api/evaluations/evaluationApi';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';
const examens = ref([]); // Liste de tous les examens
const selectedExamId = ref(''); // ID sélectionné
const examen = ref({
  // Examen sélectionné
  designation: '',
  type_session: '',
  semestre: '',
  date_debut: '',
  etat: '',
});

const planification = ref({
  description: '',
  date_debut: '',
  date_fin: '',
  statut: '',
  session_id: '',
  filiere_id: '',
  annee_id: '',
});

const filieres = ref([]); // charge les filières depuis l'API
const annees = ref([]); // charge les années depuis l'API

onMounted(async () => {
  try {
    const response = await getSessions();
    examens.value = response;
    console.log('Examens chargés :', examens.value);
  } catch (err) {
    console.error('Erreur lors du chargement des examens :', err);
  }
});

function onSelectExam() {
  const selected = examens.value.find((ex) => ex.session_id === selectedExamId.value);
  if (selected) {
    examen.value = {
      designation: selected.nom_session,
      type_session: selected.type_session,
      semestre: selected.semestre,
      date_debut: toInputDateFormat(selected.date_debut),
      etat: selected.etat,
    };
  }
}

function submitPlanning() {
  const newExamen = { ...examen.value };
  emit('examen-ajoute', newExamen); // <-- émettre l'examen ajouté

  // Fermer la modale
  const modal = document.getElementById('addPlanningModal');
  const bootstrapModal = bootstrap.Modal.getInstance(modal);
  bootstrapModal.hide();
}

dayjs.extend(localizedFormat);
dayjs.locale('fr'); // Set the locale to French
function toInputDateFormat(dateString) {
  return dayjs(dateString).format('DD MMMM YYYY');
}
</script>
