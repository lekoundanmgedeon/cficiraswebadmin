<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Ressources Pédagogiques</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-cloud-upload me-1"></i>
        Partagez et organisez les supports de cours, documents de TD et archives pour vos classes.
      </p>
    </div>

    <!-- Zone de Téléversement Rapide (Drag & Drop) -->
    <div class="col-12 mb-4">
      <div
        class="card border-0 shadow-sm drag-drop-area rounded-4 p-5 text-center"
        :class="{ 'drag-over': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleFileDrop"
        @click="triggerFileInput"
      >
        <!-- Input invisible mais fonctionnel au clic -->
        <input type="file" ref="fileInput" class="d-none" @change="handleFileSelect" multiple />

        <div class="py-3">
          <i class="bi bi-cloud-arrow-up-fill text-primary display-4 mb-3 d-block"></i>
          <h5 class="fw-bold text-dark mb-1">Glissez-déposez vos fichiers ici</h5>
          <p class="text-muted small mb-3">ou cliquez pour parcourir vos documents locaux</p>
          <span class="badge bg-light text-muted border px-3 py-2"
            >PDF, DOCX, PPTX, ZIP, MP4 (Max. 50 Mo)</span
          >
        </div>
      </div>
    </div>

    <!-- Filtres d'affichage "Flat Design" -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3">
            <!-- Recherche par nom de fichier -->
            <div class="col-md-5">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="bi bi-search text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher un document ou mot-clé..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <!-- Filtre par Matière -->
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="filterMatiere">
                <option value="">Toutes les matières</option>
                <option v-for="m in mockMatieres" :key="m">{{ m }}</option>
              </select>
            </div>
            <!-- Filtre par Type de document -->
            <div class="col-md-2">
              <select class="form-select border-0 shadow-sm" v-model="filterType">
                <option value="">Tous les types</option>
                <option value="Cours">Cours (PDF/PPT)</option>
                <option value="TD">TD / Exercices</option>
                <option value="Corrigé">Corrigés</option>
                <option value="Vidéo">Médias / Vidéos</option>
              </select>
            </div>
            <!-- Reset -->
            <div class="col-md-2">
              <button class="btn btn-white w-100 shadow-sm border-0" @click="resetFilters">
                <i class="bi bi-sliders me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des Documents Partagés -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Type</th>
                  <th>Nom du Document</th>
                  <th>Cours & Matière</th>
                  <th>Classe Cible</th>
                  <th>Taille / Date</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="resource in filteredResources" :key="resource.id" class="transition-all">
                  <!-- Icône du format de fichier -->
                  <td class="ps-4">
                    <span class="badge p-2 rounded-3" :class="getFileBadgeClass(resource.format)">
                      <i class="bi fs-5" :class="getFileIcon(resource.format)"></i>
                    </span>
                  </td>

                  <!-- Nom et catégorie du fichier -->
                  <td>
                    <div class="fw-bold text-dark">{{ resource.nom }}</div>
                    <span
                      class="badge bg-soft-secondary text-secondary mt-1 px-2 py-1"
                      style="font-size: 10px"
                    >
                      {{ resource.type }}
                    </span>
                  </td>

                  <!-- Matière liée -->
                  <td>
                    <div class="text-secondary small fw-semibold">{{ resource.matiere }}</div>
                  </td>

                  <!-- Classe concernée -->
                  <td>
                    <span class="badge bg-light text-primary border px-2 py-1">
                      {{ resource.classe }}
                    </span>
                  </td>

                  <!-- Taille et date d'ajout -->
                  <td>
                    <div class="small text-dark fw-medium">{{ resource.taille }}</div>
                    <small class="text-muted">Ajouté le {{ resource.date_ajout }}</small>
                  </td>

                  <!-- Actions sur le fichier -->
                  <td class="text-end pe-4">
                    <!-- Bouton Télécharger -->
                    <button class="btn btn-link text-primary p-0 me-3" title="Télécharger">
                      <i class="bi bi-download fs-5"></i>
                    </button>
                    <!-- Bouton Supprimer -->
                    <button
                      class="btn btn-link text-danger p-0"
                      title="Supprimer"
                      @click="deleteResource(resource.id)"
                    >
                      <i class="bi bi-trash3 fs-5"></i>
                    </button>
                  </td>
                </tr>

                <!-- Cas où la bibliothèque est vide -->
                <tr v-if="filteredResources.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <h6 class="text-muted fw-bold">Aucune ressource trouvée</h6>
                    <p class="small text-muted mb-0">
                      Glissez un fichier dans la zone supérieure pour enrichir l'espace.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// États d'interactions
const isDragging = ref(false);
const fileInput = ref(null);
const searchQuery = ref('');
const filterMatiere = ref('');
const filterType = ref('');

// Options pour filtres
const mockMatieres = ref([
  'Algorithmique & Structures de Données',
  'Architecture des Systèmes Cloud',
  'Marketing Digital & Stratégie',
  'Anglais des Affaires',
]);

// Liste de données factices
const mockResources = ref([
  {
    id: 1,
    nom: 'Support_Cours_VueJS_Introduction.pdf',
    type: 'Cours',
    format: 'pdf',
    matiere: 'Algorithmique & Structures de Données',
    classe: 'Master 1 Info',
    taille: '4.2 Mo',
    date_ajout: '14/05/2026',
  },
  {
    id: 2,
    nom: 'Enonce_TD3_Recursivite_Avancee.docx',
    type: 'TD',
    format: 'word',
    matiere: 'Algorithmique & Structures de Données',
    classe: 'Master 1 Info',
    taille: '1.1 Mo',
    date_ajout: '15/05/2026',
  },
  {
    id: 3,
    nom: 'Architecture_AWS_Deploy_Prod.pptx',
    type: 'Cours',
    format: 'powerpoint',
    matiere: 'Architecture des Systèmes Cloud',
    classe: 'Master 2 Info',
    taille: '12.8 Mo',
    date_ajout: '10/05/2026',
  },
  {
    id: 4,
    nom: 'Video_Tuto_Configuration_Docker.mp4',
    type: 'Vidéo',
    format: 'video',
    matiere: 'Architecture des Systèmes Cloud',
    classe: 'Master 2 Info',
    taille: '34.0 Mo',
    date_ajout: '12/05/2026',
  },
  {
    id: 5,
    nom: 'Archive_Sujets_Examens_2025.zip',
    type: 'Corrigé',
    format: 'zip',
    matiere: 'Marketing Digital & Stratégie',
    classe: 'Licence 3 Management',
    taille: '8.5 Mo',
    date_ajout: '01/05/2026',
  },
]);

// Filtrage intelligent
const filteredResources = computed(() => {
  return mockResources.value.filter((res) => {
    const matchesSearch = res.nom.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesMatiere = filterMatiere.value === '' || res.matiere === filterMatiere.value;
    const matchesType = filterType.value === '' || res.type === filterType.value;
    return matchesSearch && matchesMatiere && matchesType;
  });
});

// Déclencheurs de l'explorateur de fichier au clic
const triggerFileInput = () => fileInput.value.click();

const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length > 0) processUploadedFiles(files);
};

const handleFileDrop = (event) => {
  isDragging.value = false;
  const files = event.dataTransfer.files;
  if (files.length > 0) processUploadedFiles(files);
};

// Simulation d'ajout de ressource après upload
const processUploadedFiles = (files) => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const extension = file.name.split('.').pop().toLowerCase();

    mockResources.value.unshift({
      id: Date.now() + i,
      nom: file.name,
      type: 'Cours', // Par défaut
      format: ['pdf', 'zip', 'mp4'].includes(extension) ? extension : 'word',
      matiere: filterMatiere.value || 'Algorithmique & Structures de Données',
      classe: 'Générique',
      taille: (file.size / (1024 * 1024)).toFixed(1) + ' Mo',
      date_ajout: new Date().toLocaleDateString('fr-FR'),
    });
  }
};

// Helpers graphiques pour adapter les icônes selon l'extension
const getFileIcon = (format) => {
  switch (format) {
    case 'pdf':
      return 'bi-file-earmark-pdf';
    case 'word':
      return 'bi-file-earmark-word';
    case 'powerpoint':
      return 'bi-file-earmark-slides';
    case 'video':
      return 'bi-file-earmark-play';
    case 'zip':
      return 'bi-file-earmark-zip';
    default:
      return 'bi-file-earmark-text';
  }
};

const getFileBadgeClass = (format) => {
  switch (format) {
    case 'pdf':
      return 'bg-soft-danger text-danger';
    case 'word':
      return 'bg-soft-primary text-primary';
    case 'powerpoint':
      return 'bg-soft-warning text-warning';
    case 'video':
      return 'bg-soft-success text-success';
    case 'zip':
      return 'bg-soft-purple text-purple';
    default:
      return 'bg-soft-secondary text-secondary';
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  filterMatiere.value = '';
  filterType.value = '';
};

const deleteResource = (id) => {
  if (confirm('Supprimer définitivement ce document de la bibliothèque pédagogique ?')) {
    mockResources.value = mockResources.value.filter((res) => res.id !== id);
  }
};
</script>

<style scoped>
/* Zone de Drag & Drop (Récupération et fignolage de ton idée) */
.drag-drop-area {
  background: #ffffff;
  border: 2px dashed #007bff;
  cursor: pointer;
  transition: all 0.25s ease-in-out;
}
.drag-drop-area:hover,
.drag-drop-area.drag-over {
  background: #f1f7ff;
  border-color: #0056b3;
  transform: translateY(-2px);
}

/* Couleurs Soft Thématiques */
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.12);
  color: #b58105;
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}
.bg-soft-purple {
  background-color: rgba(111, 66, 193, 0.1);
  color: #6f42c1;
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.table th {
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
