<template>
  <div class="row">
    <!-- Header avec Statistiques Rapides -->
    <div class="col-12 mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h3 class="fw-bold mb-1">Répertoire des Étudiants</h3>
        <p class="text-muted small mb-0">
          <i class="mdi mdi-account-group-outline me-1"></i>
          Total : <b>{{ etudiants.length }}</b> étudiants inscrits cette année.
        </p>
      </div>

      <div class="dropdown me-2">
        <button
          class="btn btn-outline-dark dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
        >
          Exporter
        </button>

        <ul class="dropdown-menu">
          <li>
            <button class="dropdown-item" @click="exportStudentsPDF">Export PDF</button>
          </li>

          <li>
            <button class="dropdown-item" @click="exportCSV">Export CSV</button>
          </li>

          <li>
            <button class="dropdown-item" @click="exportStudentsExcel">Export Excel</button>
          </li>

          <li>
            <button class="dropdown-item" @click="printTable">Imprimer</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Zone de Filtres "Flat Design" -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3">
            <div class="col-md-5">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="mdi mdi-magnify text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher par nom, matricule..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="filterFiliere">
                <option value="">Toutes les filières</option>
                <option v-for="f in filieres" :key="f">{{ f }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select border-0 shadow-sm" v-model="filterSexe">
                <option value="">Genre</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="mdi mdi-filter-variant me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau des Étudiants -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">#</th>
                  <th>Étudiant</th>
                  <th>Matricule</th>
                  <th class="text-center">Genre</th>
                  <th>Parcours Académique</th>
                  <th>Année</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <!-- Loader -->
                <tr v-if="loading">
                  <td colspan="7" class="text-center py-5">
                    <div class="spinner-border text-primary spinner-border-sm me-2"></div>
                    Chargement de la base de données...
                  </td>
                </tr>

                <!-- Liste -->
                <tr
                  v-for="(etudiant, index) in paginatedEtudiants"
                  :key="etudiant.id"
                  class="transition-all"
                >
                  <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div
                        class="avatar-circle me-3"
                        :class="
                          etudiant.sexe === 'M'
                            ? 'bg-soft-info text-info'
                            : 'bg-soft-warning text-warning'
                        "
                      >
                        {{ etudiant.nom[0] }}{{ etudiant.prenom[0] }}
                      </div>
                      <div>
                        <div class="fw-bold text-dark">
                          {{ etudiant.nom }} {{ etudiant.prenom }}
                        </div>
                        <small class="text-muted">Inscrit via Dossier Papier</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-light text-primary border fw-bold">{{
                      etudiant.matricule
                    }}</span>
                  </td>
                  <td class="text-center">
                    <span
                      class="badge rounded-pill px-3 py-2"
                      :class="
                        etudiant.sexe === 'M'
                          ? 'bg-soft-info text-info'
                          : 'bg-soft-warning text-warning'
                      "
                    >
                      <i
                        class="mdi"
                        :class="etudiant.sexe === 'M' ? 'mdi-gender-male' : 'mdi-gender-female'"
                      ></i>
                      {{ etudiant.sexe }}
                    </span>
                  </td>
                  <td>
                    <div class="fw-semibold">{{ etudiant.classe }}</div>
                    <small class="text-muted">{{ etudiant.filiere }}</small>
                  </td>
                  <td>
                    <span class="text-dark">{{ etudiant.annee_academique }}</span>
                  </td>
                  <td class="text-end pe-4">
                    <ItemActions
                      :item="etudiant"
                      :showAdd="false"
                      editModalTarget="#editEtudiantModal"
                      @edit="editEtudiant"
                      @delete="confirmDelete"
                      class="d-inline-block"
                    />
                  </td>
                </tr>

                <!-- Vide -->
                <tr v-if="!loading && paginatedEtudiants.length === 0">
                  <td colspan="7" class="text-center py-5">
                    <div class="py-4">
                      <img
                        src="/img/empty-box.svg"
                        alt="Vide"
                        width="100"
                        class="mb-3 opacity-50"
                      />
                      <h6 class="text-muted">Aucun étudiant trouvé</h6>
                      <p class="small text-muted">Essayez de modifier vos critères de recherche.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Footer / Pagination -->
        <div class="card-footer bg-white border-0 py-3">
          <Pagination
            v-model="currentPage"
            :items-per-page="itemsPerPage"
            :total-items="filteredEtudiants.length"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import ItemActions from '../details/ItemActions.vue';
import Pagination from '@/components/shared/Pagination.vue';
import logoCFI from '@/assets/logoBase64';
import { exportExcel } from '@/utils/exportExcel';
import { exportPDF } from '@/utils/exportPDF';

const searchQuery = ref('');
const filterFiliere = ref('');
const filterSexe = ref('');
const loading = ref(false);

// =========================
// MOCK ETUDIANTS
// =========================
const etudiants = ref([
  {
    id: 1,
    nom: 'Diop',
    prenom: 'Moussa',
    matricule: 'ETU001',
    email: 'moussa.diop@example.com',
    telephone: '770000001',
    filiere: 'Informatique',
  },
  {
    id: 2,
    nom: 'Fall',
    prenom: 'Aminata',
    matricule: 'ETU002',
    email: 'aminata.fall@example.com',
    telephone: '770000002',
    filiere: 'Réseaux',
  },
  {
    id: 3,
    nom: 'Ndiaye',
    prenom: 'Cheikh',
    matricule: 'ETU003',
    email: 'cheikh.ndiaye@example.com',
    telephone: '770000003',
    filiere: 'Télécom',
  },
  {
    id: 4,
    nom: 'Ba',
    prenom: 'Fatou',
    matricule: 'ETU004',
    email: 'fatou.ba@example.com',
    telephone: '770000004',
    filiere: 'Gestion',
  },
  {
    id: 5,
    nom: 'Sow',
    prenom: 'Ibrahima',
    matricule: 'ETU005',
    email: 'ibrahima.sow@example.com',
    telephone: '770000005',
    filiere: 'Marketing',
  },
  {
    id: 6,
    nom: 'Seck',
    prenom: 'Mariama',
    matricule: 'ETU006',
    email: 'mariama.seck@example.com',
    telephone: '770000006',
    filiere: 'Comptabilité',
  },
  {
    id: 7,
    nom: 'Kane',
    prenom: 'Omar',
    matricule: 'ETU007',
    email: 'omar.kane@example.com',
    telephone: '770000007',
    filiere: 'Droit',
  },
  {
    id: 8,
    nom: 'Diallo',
    prenom: 'Awa',
    matricule: 'ETU008',
    email: 'awa.diallo@example.com',
    telephone: '770000008',
    filiere: 'Finance',
  },
  {
    id: 9,
    nom: 'Sy',
    prenom: 'Mamadou',
    matricule: 'ETU009',
    email: 'mamadou.sy@example.com',
    telephone: '770000009',
    filiere: 'Informatique',
  },
  {
    id: 10,
    nom: 'Camara',
    prenom: 'Khadija',
    matricule: 'ETU010',
    email: 'khadija.camara@example.com',
    telephone: '770000010',
    filiere: 'Réseaux',
  },
  {
    id: 11,
    nom: 'Lo',
    prenom: 'Seynabou',
    matricule: 'ETU011',
    email: 'seynabou.lo@example.com',
    telephone: '770000011',
    filiere: 'Télécom',
  },
  {
    id: 12,
    nom: 'Gueye',
    prenom: 'Alioune',
    matricule: 'ETU012',
    email: 'alioune.gueye@example.com',
    telephone: '770000012',
    filiere: 'Gestion',
  },
  {
    id: 13,
    nom: 'Cissé',
    prenom: 'Rokhaya',
    matricule: 'ETU013',
    email: 'rokhaya.cisse@example.com',
    telephone: '770000013',
    filiere: 'Marketing',
  },
  {
    id: 14,
    nom: 'Faye',
    prenom: 'Serigne',
    matricule: 'ETU014',
    email: 'serigne.faye@example.com',
    telephone: '770000014',
    filiere: 'Comptabilité',
  },
  {
    id: 15,
    nom: 'Thiam',
    prenom: 'Astou',
    matricule: 'ETU015',
    email: 'astou.thiam@example.com',
    telephone: '770000015',
    filiere: 'Finance',
  },
  {
    id: 16,
    nom: 'Mbaye',
    prenom: 'Lamine',
    matricule: 'ETU016',
    email: 'lamine.mbaye@example.com',
    telephone: '770000016',
    filiere: 'Droit',
  },
  {
    id: 17,
    nom: 'Niang',
    prenom: 'Adama',
    matricule: 'ETU017',
    email: 'adama.niang@example.com',
    telephone: '770000017',
    filiere: 'Informatique',
  },
  {
    id: 18,
    nom: 'Toure',
    prenom: 'Binta',
    matricule: 'ETU018',
    email: 'binta.toure@example.com',
    telephone: '770000018',
    filiere: 'Télécom',
  },
  {
    id: 19,
    nom: 'Sarr',
    prenom: 'Modou',
    matricule: 'ETU019',
    email: 'modou.sarr@example.com',
    telephone: '770000019',
    filiere: 'Gestion',
  },
  {
    id: 20,
    nom: 'Ka',
    prenom: 'Ndeye',
    matricule: 'ETU020',
    email: 'ndeye.ka@example.com',
    telephone: '770000020',
    filiere: 'Réseaux',
  },
]);

// =========================
// PAGINATION
// =========================
const currentPage = ref(1);
const itemsPerPage = ref(10);

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);

const filteredEtudiants = computed(() => {
  return etudiants.value.filter((etudiant) => {
    const search = searchQuery.value.toLowerCase().trim();
    const matchesSearch =
      !search ||
      etudiant.nom.toLowerCase().includes(search) ||
      etudiant.prenom.toLowerCase().includes(search) ||
      etudiant.matricule.toLowerCase().includes(search);

    const matchesFiliere = !filterFiliere.value || etudiant.filiere === filterFiliere.value;
    const matchesSexe = !filterSexe.value || etudiant.sexe === filterSexe.value;

    return matchesSearch && matchesFiliere && matchesSexe;
  });
});

const paginatedEtudiants = computed(() =>
  filteredEtudiants.value.slice(startIndex.value, startIndex.value + itemsPerPage.value)
);

// =========================
// ACTIONS
// =========================
const editEtudiant = (etudiant) => {
  console.log('Edit étudiant :', etudiant);
};

const confirmDelete = (etudiant) => {
  if (confirm(`Voulez-vous vraiment supprimer ${etudiant.nom} ${etudiant.prenom} ?`)) {
    etudiants.value = etudiants.value.filter((item) => item.id !== etudiant.id);
  }
};

const getExportStudentsData = () =>
  filteredEtudiants.value.map((etudiant, index) => ({
    Rang: index + 1,
    Nom: `${etudiant.nom} ${etudiant.prenom}`,
    Matricule: etudiant.matricule,
    Email: etudiant.email,
    Téléphone: etudiant.telephone,
    Filière: etudiant.filiere,
    Année: etudiant.annee_academique || '-',
    Genre: etudiant.sexe || '-',
  }));

const exportStudentsExcel = () => {
  exportExcel({
    data: getExportStudentsData(),
    sheetName: 'Étudiants',
    fileName: `etudiants_${new Date().getTime()}.xlsx`,
  });
};

const exportStudentsPDF = () => {
  exportPDF({
    logoBase64: logoCFI,
    title: 'Liste des étudiants',
    filters: [
      { label: 'Total étudiants', value: filteredEtudiants.value.length },
      { label: 'Date', value: new Date().toLocaleDateString('fr-FR') },
    ],
    columns: ['Rang', 'Nom', 'Matricule', 'Email', 'Téléphone', 'Filière', 'Année', 'Genre'],
    rows: filteredEtudiants.value.map((etudiant, index) => [
      index + 1,
      `${etudiant.nom} ${etudiant.prenom}`,
      etudiant.matricule,
      etudiant.email,
      etudiant.telephone,
      etudiant.filiere,
      etudiant.annee_academique || '-',
      etudiant.sexe || '-',
    ]),
    fileName: `etudiants_${new Date().getTime()}.pdf`,
  });
};

const exportCSV = () => {
  const headers = ['Rang', 'Nom', 'Matricule', 'Email', 'Téléphone', 'Filière', 'Année', 'Genre'];
  const rows = filteredEtudiants.value.map((etudiant, index) => [
    index + 1,
    `${etudiant.nom} ${etudiant.prenom}`,
    etudiant.matricule,
    etudiant.email,
    etudiant.telephone,
    etudiant.filiere,
    etudiant.annee_academique || '-',
    etudiant.sexe || '-',
  ]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `etudiants_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const printTable = () => {
  const printContent = document.querySelector('.table-responsive').innerHTML;
  const printWindow = window.open('', '', 'width=900,height=650');
  printWindow.document.write(`
    <html>
      <head>
        <title>Impression des étudiants</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 10px; border: 1px solid #ddd; }
          th { background: #f8f9fa; }
        </style>
      </head>
      <body>
        <h3>Liste des étudiants</h3>
        ${printContent}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

const resetFilters = () => {
  searchQuery.value = '';
  filterFiliere.value = '';
  filterSexe.value = '';
};
</script>

<style scoped>
/* Avatars */
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: -0.5px;
}

/* Couleurs Soft (Badge & Avatar) */
.bg-soft-info {
  background-color: rgba(13, 202, 240, 0.12);
  color: #0dcaf0;
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
  color: #997404;
}

/* Table styling */
.table thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}

.table tbody tr {
  border-bottom: 1px solid #f8f9fa;
  transition: background 0.2s;
}

.table tbody tr:hover {
  background-color: #fcfdfe !important;
}

/* Buttons & Inputs */
.btn-white {
  background: #fff;
  border: 1px solid #edf2f9;
}
.rounded-4 {
  border-radius: 0.2rem !important;
}

.transition-all {
  transition: all 0.3s ease;
}
</style>
