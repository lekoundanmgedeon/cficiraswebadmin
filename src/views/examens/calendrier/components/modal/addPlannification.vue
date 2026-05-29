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

            <div class="mb-3">
              <label class="form-label">Semestre</label>
              <input type="text" class="form-control" v-model="examen.semestre" readonly />
            </div>

            <div class="mb-3">
              <label class="form-label">Date prévue</label>
              <input type="text" class="form-control" v-model="examen.date_debut" readonly />
            </div>

            <div class="mb-3">
              <label class="form-label">État</label>
              <input type="text" class="form-control" v-model="examen.etat" readonly />
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
