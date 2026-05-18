<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Archives des Maquettes Pédagogiques</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-archive-fill me-1"></i>
        Consultez l'historique immuable des modules, matières et coefficients des années académiques clôturées.
      </p>
    </div>

    <!-- Sélections et filtres historiques -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-center">
            <!-- Choix de l'année d'archive -->
            <div class="col-md-4">
              <label class="form-label small fw-semibold text-muted mb-1">Année Historique</label>
              <select class="form-select border-0 shadow-sm" v-model="selectedAnnee">
                <option value="2024-2025">Année Académique 2024 / 2025</option>
                <option value="2023-2024">Année Académique 2023 / 2024</option>
                <option value="2022-2023">Année Académique 2022 / 2023</option>
              </select>
            </div>
            <!-- Recherche rapide par texte -->
            <div class="col-md-5">
              <label class="form-label small fw-semibold text-muted mb-1">Recherche de composant</label>
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="bi bi-search text-warning"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher une ancienne UE ou matière..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <!-- Indicateur de verrouillage -->
            <div class="col-md-3 text-md-end mt-4">
              <span class="badge bg-soft-secondary text-secondary px-3 py-2 rounded">
                <i class="bi bi-lock-fill me-1"></i> Registre Scellé & Immuable
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grille/Liste des Structures Archivées -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-folder-symlink-fill text-warning me-2"></i>Maquette Structurelle — {{ selectedAnnee }}
          </h5>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Code & Module (UE)</th>
                  <th>Matières Historiques Incluses</th>
                  <th class="text-center">Coefficients globaux</th>
                  <th class="text-center">Crédits ECTS</th>
                  <th class="text-end pe-4">Historique</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="archive in filteredArchives" :key="archive.id" class="transition-all">
                  
                  <!-- Code et libellé du module -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div class="archive-icon bg-soft-warning text-warning rounded-3 me-3">
                        <i class="bi bi-folder-fill fs-5"></i>
                      </div>
                      <div>
                        <div class="fw-bold text-dark">{{ archive.code }}</div>
                        <small class="text-muted">{{ archive.nom }}</small>
                      </div>
                    </div>
                  </td>

                  <!-- Liste à puces des matières qui composaient l'UE à cette époque -->
                  <td>
                    <ul class="list-unstyled mb-0 small text-secondary">
                      <li v-for="(mat, idx) in archive.matieres" :key="idx" class="mb-1">
                        <i class="bi bi-dot text-warning"></i> {{ mat.nom }} <span class="text-muted">(Coef. {{ mat.coef }})</span>
                      </li>
                    </ul>
                  </td>

                  <!-- Total des coefficients de l'époque -->
                  <td class="text-center fw-semibold text-dark">
                    {{ archive.totalCoef }}
                  </td>

                  <!-- ECTS attribués à l'époque -->
                  <td class="text-center">
                    <span class="badge bg-light text-dark border px-2 py-1">
                      {{ archive.ects }} ECTS
                    </span>
                  </td>

                  <!-- Action de téléchargement du syllabus historique -->
                  <td class="text-end pe-4">
                    <button 
                      class="btn btn-light btn-sm border shadow-sm rounded-pill px-3"
                      @click="downloadSyllabus(archive.code)"
                    >
                      <i class="bi bi-download text-success me-1"></i> Syllabus
                    </button>
                  </td>

                </tr>

                <!-- Cas vide -->
                <tr v-if="filteredArchives.length === 0">
                  <td colspan="5" class="text-center py-5">
                    <h6 class="text-muted fw-bold">Aucune archive trouvée pour ce cycle</h6>
                    <p class="small text-muted mb-0">Modifiez les critères ou l'année de recherche.</p>
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

// Filtres
const selectedAnnee = ref('2024-2025');
const searchQuery = ref('');

// Structure de données historique des maquettes (Mock Data)
const mockModuleArchives = ref([
  // Maquettes 2024-2025
  { 
    id: 1, 
    annee: '2024-2025', 
    code: 'UE-INF-1', 
    nom: 'Architecture Logicielle & Outils avancés', 
    totalCoef: 4, 
    ects: 8,
    matieres: [
      { nom: 'Conception orientée objet & Patterns', coef: 2 },
      { nom: 'Frameworks Modernes (Vue & Node)', coef: 2 }
    ]
  },
  { 
    id: 2, 
    annee: '2024-2025', 
    code: 'UE-DATA-2', 
    nom: 'Data Science & Intelligence Artificielle', 
    totalCoef: 5, 
    ects: 10,
    matieres: [
      { nom: 'Bases du Machine Learning', coef: 3 },
      { nom: 'Deep Learning & Vision', coef: 2 }
    ]
  },
  
  // Maquettes 2023-2024
  { 
    id: 3, 
    annee: '2023-2024', 
    code: 'UE-DEV-2024', 
    nom: 'Algorithmique & Structures de Données complexes', 
    totalCoef: 3, 
    ects: 6,
    matieres: [
      { nom: 'Graphes et optimisation', coef: 2 },
      { nom: 'Langage C++ avancé', coef: 1 }
    ]
  }
]);

// Filtrage combiné (Année historique + terme de recherche sur le code, nom de l'UE ou de sa matière)
const filteredArchives = computed(() => {
  return mockModuleArchives.value.filter(arc => {
    const matchesAnnee = arc.annee === selectedAnnee.value;
    
    const term = searchQuery.value.toLowerCase();
    const matchesModule = arc.nom.toLowerCase().includes(term) || arc.code.toLowerCase().includes(term);
    const matchesMatiere = arc.matieres.some(m => m.nom.toLowerCase().includes(term));

    return matchesAnnee && (matchesModule || matchesMatiere);
  });
});

// Action : Télécharger l'ancien descriptif de cours (Syllabus)
const downloadSyllabus = (code) => {
  alert(`Extraction du Syllabus historique officiel pour l'unité d'enseignement : ${code} (${selectedAnnee.value})`);
};
</script>

<style scoped>
/* Icone dossier archivé */
.archive-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Couleurs douces */
.bg-soft-warning { background-color: rgba(255, 193, 7, 0.12); color: #ffc107; }
.bg-soft-secondary { background-color: rgba(108, 117, 125, 0.1); color: #6c757d; }

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

/* Identité Flat Design */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select {
  font-size: 0.85rem;
}
.transition-all {
  transition: all 0.3s ease;
}
</style>
