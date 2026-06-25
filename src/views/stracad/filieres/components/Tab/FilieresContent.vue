<template>
  <div class="row">
    <div class="col-12 mb-3 d-flex justify-content-between align-items-center">
      <div>
        <h4>Liste des filières</h4>
        <p class="text-muted">Listes de tout les filière ajoutées jusque là.</p>
      </div>
      <div class="btn-group">
        <button
          class="btn btn-outline-dark dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        > Exporter
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <button class="dropdown-item" type="button" @click="exportFilieresExcel">
              <i class="mdi mdi-file-excel-box me-2"></i> Excel
            </button>
          </li>
          <li>
            <button class="dropdown-item" type="button" @click="exportFilieresPDF">
              <i class="mdi mdi-file-pdf-box me-2"></i> PDF
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>code</th>
            <th>designation</th>
            <th>cycles</th>
            <th>nbre classes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <!-- Cas vide -->
          <tr v-if="filieres.length === 0">
            <td colspan="6" class="text-center py-4">
              <div class="d-flex flex-column align-items-center">
                <img src="/img/empty-box.svg" alt="Aucune donnée" class="mb-2" />
                <div class="text-pr">Aucune donnée</div>
              </div>
            </td>
          </tr>
          <!-- Boucle sur les filières -->
          <tr v-for="(filiere, index) in filieres" :key="filiere.id">
            <td>{{ index + 1 }}</td>
            <td class="fw-bold">{{ filiere.code }}</td>
            <td>{{ filiere.designation }}</td>
            <td>{{ filiere.cycle_nom || '-' }}</td>
            <td>
              <span class="badge" :class="filiere.nb_classes > 0 ? 'bg-success' : 'bg-secondary'">
                {{ filiere.nb_classes }}
              </span>
            </td>
            <td>
              <FilieresItemActions
                :item="filiere"
                :showAdd="false"
                @edit="editFiliere"
                @delete="deleteFiliere"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useFiliereStore } from '@/stores/academiqueStore/filiereStore';
import { useNotifier } from '@/stores/messages/useNotifier';
import FilieresItemActions from '../details/FilieresItemActions.vue';
import logoCFI from '@/assets/logoBase64';
import { exportExcel } from '@/utils/exportExcel';
import { exportPDF } from '@/utils/exportPDF';

// Stores
const filiereStore = useFiliereStore();
const messageStore = useNotifier();

// Récupération des filières depuis le store
const filieres = computed(() => filiereStore.filieres);

// Charger les données au montage
onMounted(async () => {
  try {
    await filiereStore.fetchFilieres();
  } catch (error) {
    messageStore.addMessage('Erreur lors du chargement des filières');
  }
});

// Méthodes pour actions
const editFiliere = (filiere) => {
  // ouvrir ton modal d’édition avec la filière sélectionnée
  console.log('Édition de la filière :', filiere);
};

const deleteFiliere = async (filiere) => {
  await filiereStore.removeFiliere(filiere.id);
};

const getExportFilieresData = () =>
  filieres.value.map((filiere, index) => ({
    Rang: index + 1,
    Code: filiere.code,
    Désignation: filiere.designation,
    Cycle: filiere.cycle_nom || '-',
    'Nombre de classes': filiere.nb_classes ?? 0,
  }));

const exportFilieresExcel = () => {
  if (!filieres.value.length) {
    messageStore.addMessage('Aucune filière disponible pour l’export.');
    return;
  }

  exportExcel({
    data: getExportFilieresData(),
    sheetName: 'Filières',
    fileName: `filieres_${new Date().getTime()}.xlsx`,
  });
};

const exportFilieresPDF = () => {
  if (!filieres.value.length) {
    messageStore.addMessage('Aucune filière disponible pour l’export.');
    return;
  }

  exportPDF({
    logoBase64: logoCFI,
    title: 'Liste des filières',
    filters: [
      { label: 'Total filières', value: filieres.value.length },
      { label: 'Date', value: new Date().toLocaleDateString('fr-FR') },
    ],
    columns: ['Rang', 'Code', 'Désignation', 'Cycle', 'Nombre de classes'],
    rows: filieres.value.map((filiere, index) => [
      index + 1,
      filiere.code,
      filiere.designation,
      filiere.cycle_nom || '-',
      filiere.nb_classes ?? 0,
    ]),
    fileName: `filieres_${new Date().getTime()}.pdf`,
  });
};
</script>
