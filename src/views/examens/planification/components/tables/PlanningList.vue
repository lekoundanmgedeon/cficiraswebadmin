<template>
  <table class="table table-hover table-nowrap mb-0">
    <thead>
      <tr>
        <th>Désignation</th>
        <th>Filière</th>
        <th>Année académique</th>
        <th>Statut</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="(plan, index) in planning" :key="plan.planification_id">
        <td>{{ plan.designation }}</td>

        <td>{{ plan.designation_filiere }}</td>

        <td>{{ plan.code_annee_academique }}</td>

        <td>
          <span class="badge" :class="getStatusClass(plan.statut)">
            {{ getStatusLabel(plan.statut) }}
          </span>
        </td>

        <td>
          <ItemActions
            :item="plan"
            moduleRoute="/planning"
            :showAdd="true"
            editModalTarget="#editExamModal"
            @edit="editExam"
            @delete="confirmDelete"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref } from 'vue';
import ItemActions from '../details/DetailPlan.vue';

// ✅ Mock data
const planning = ref([
  {
    planification_id: 1,
    designation: 'Examen Mathématiques',
    designation_filiere: 'Informatique',
    code_annee_academique: '2025-2026',
    statut: 'planifiée',
  },
  {
    planification_id: 2,
    designation: 'Examen Physique',
    designation_filiere: 'Génie Civil',
    code_annee_academique: '2025-2026',
    statut: 'en_attente',
  },
  {
    planification_id: 3,
    designation: 'Examen Réseau',
    designation_filiere: 'Télécom',
    code_annee_academique: '2025-2026',
    statut: 'terminé',
  },
  {
    planification_id: 4,
    designation: 'Examen Chimie',
    designation_filiere: 'Biologie',
    code_annee_academique: '2025-2026',
    statut: 'annulé',
  },
]);

const getStatusClass = (status) => {
  const classes = {
    planifiée: 'bg-primary text-white',
    en_attente: 'bg-warning text-dark',
    annulé: 'bg-danger text-white',
    terminé: 'bg-success text-white',
  };

  return classes[status] || 'bg-light text-dark';
};

const getStatusLabel = (status) => {
  const labels = {
    planifiée: 'Planifiée',
    en_attente: 'En attente',
    annulé: 'Annulé',
    terminé: 'Terminé',
  };

  return labels[status] || status;
};

const editExam = (exam) => {
  console.log("Éditer l'examen :", exam);
};

const confirmDelete = (exam) => {
  console.log("Confirmer la suppression de l'examen :", exam);
};
</script>

<style scoped>
.badge {
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 500;
  border-radius: 50rem;
}
</style>
