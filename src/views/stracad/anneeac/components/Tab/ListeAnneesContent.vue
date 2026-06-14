<template>
  <div class="row">
    <h4>Liste des années académiques</h4>
    <p>
      Vous pouvez consulter les détails de chaque année académique en cliquant sur le lien
      correspondant.
    </p>

    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Statut</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <!-- Vérifie si la liste est vide -->
          <tr v-if="annees.length === 0">
            <td colspan="7" class="text-center py-4">
              <div class="d-flex flex-column align-items-center">
                <img src="/img/empty-box.svg" alt="Aucune donnée" class="mb-2" />
                <div class="text-pr">Aucune donnée</div>
              </div>
            </td>
          </tr>

          <!-- Boucle sur les années -->
          <tr v-for="(annee, index) in annees" :key="annee.id">
            <td>{{ index + 1 }}</td>
            <td class="fw-bold">{{ annee.code }}</td>
            <td>{{ formatDate(annee.date_debut) }}</td>
            <td>{{ formatDate(annee.date_fin) }}</td>
            <td>
              <span :class="mapStatut(annee.statut).class">
                {{ mapStatut(annee.statut).label }}
              </span>
            </td>
            <td>
              <span :class="annee.est_active ? 'badge bg-success' : 'badge bg-secondary'">
                {{ annee.est_active ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td>
              <ItemActions
                :item="annee"
                anneeRoute="/edition-annee/"
                :showAdd="false"
                @edit="editAnnee"
                @delete="confirmDelete"
                @toggle-status="toggleAnneeStatus"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAnneeStore } from '@/stores/academiqueStore/anneStore';
import { useNotifier } from '@/stores/messages/useNotifier';
import ItemActions from '../details/ItemActions.vue';

// Stores
const anneeStore = useAnneeStore();
const messageStore = useNotifier();

// Récupération des années depuis le store
const annees = computed(() => anneeStore.anneesAcademiques);

// Charger les données au montage
onMounted(async () => {
  try {
    await anneeStore.fetchAnneesAcademiques();
  } catch (error) {
    messageStore.error('Erreur lors du chargement des années académiques');
  }
});

// Méthodes de formatage
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Fonction de mapping pour statut
const mapStatut = (statut) => {
  switch (statut) {
    case 'OUVERTE':
      return { label: 'Ouverte', class: 'badge bg-success' };
    case 'PLANIFIEE':
      return { label: 'Planifiée', class: 'badge bg-warning' };
    case 'CLOTUREE':
      return { label: 'Clôturée', class: 'badge bg-danger' };
    default:
      return { label: statut || '-', class: 'badge bg-secondary' };
  }
};

// Edition
const currentAnnee = ref(null);

const editAnnee = (annee) => {
  currentAnnee.value = { ...annee }; // clone pour éviter mutation directe
  const modal = new bootstrap.Modal(document.getElementById('anneeModal'));
  modal.show();
};

// Sauvegarde
const saveAnnee = async () => {
  if (currentAnnee.value.id) {
    await anneeStore.editAnneeAcademique(currentAnnee.value.id, currentAnnee.value);
  } else {
    await anneeStore.addAnneeAcademique(currentAnnee.value);
  }
};

// Activation / Désactivation
const toggleAnneeStatus = async (annee) => {
  await anneeStore.activateAnnee(annee.id);
};

// Suppression
const confirmDelete = async (annee) => {
  await anneeStore.removeAnneeAcademique(annee.id);
};
</script>
