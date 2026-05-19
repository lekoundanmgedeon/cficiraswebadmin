<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Archives Historiques</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-archive-fill me-1"></i>
        Consultez et récupérez les données pédagogiques et administratives des années académiques
        clôturées.
      </p>
    </div>

    <!-- Filtres rapides par Année et Session -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3">
            <!-- Choix de l'année d'archivage -->
            <div class="col-md-4">
              <select class="form-select border-0 shadow-sm" v-model="selectedAnnee">
                <option value="2024-2025">Année Académique 2024 / 2025</option>
                <option value="2023-2024">Année Académique 2023 / 2024</option>
                <option value="2022-2023">Année Académique 2022 / 2023</option>
              </select>
            </div>
            <!-- Type de dossier recherché -->
            <div class="col-md-4">
              <select class="form-select border-0 shadow-sm" v-model="filterCategorie">
                <option value="">Toutes les catégories d'archives</option>
                <option value="Étudiants & Classes">Listes Étudiants & Classes</option>
                <option value="Notes & Procès-verbaux">Notes & Procès-verbaux</option>
                <option value="Assignations & Contrats">Assignations & Contrats</option>
                <option value="Supports de Cours">Supports de Cours archivés</option>
              </select>
            </div>
            <!-- Recherche par mot-clé -->
            <div class="col-md-4">
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="bi bi-search text-primary"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher une archive..."
                  v-model="searchQuery"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grille des Dossiers Archivés (Flat Folders Layout) -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-folder2-open text-warning me-2"></i>Dossiers sécurisés —
            {{ selectedAnnee }}
          </h5>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Nom de l'archive</th>
                  <th>Catégorie</th>
                  <th>Date de Clôture</th>
                  <th>Taille</th>
                  <th class="text-center">Statut</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="archive in filteredArchives" :key="archive.id" class="transition-all">
                  <!-- Nom de l'archive + Icône Dossier fermé -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div class="folder-icon bg-soft-warning text-warning rounded-3 me-3">
                        <i class="bi bi-folder-fill fs-5"></i>
                      </div>
                      <div>
                        <div class="fw-bold text-dark">{{ archive.nom }}</div>
                        <small class="text-muted">Référence : {{ archive.reference }}</small>
                      </div>
                    </div>
                  </td>

                  <!-- Catégorie métier -->
                  <td>
                    <span class="badge bg-light text-secondary border px-2 py-1">
                      {{ archive.categorie }}
                    </span>
                  </td>

                  <!-- Date de scellé/clôture -->
                  <td class="text-secondary small">{{ archive.dateCloture }}</td>

                  <!-- Poids du volume -->
                  <td class="text-muted small">{{ archive.taille }}</td>

                  <!-- Statut (Lecture seule immuable) -->
                  <td class="text-center">
                    <span class="badge rounded-pill bg-soft-secondary text-secondary px-3 py-1">
                      <i class="bi bi-lock-fill me-1" style="font-size: 10px"></i> Lecture seule
                    </span>
                  </td>

                  <!-- Actions d'extraction -->
                  <td class="text-end pe-4">
                    <!-- Consulter en ligne -->
                    <button
                      class="btn btn-link text-primary p-0 me-3"
                      title="Consulter l'historique"
                      @click="viewArchive(archive.nom)"
                    >
                      <i class="bi bi-eye fs-5"></i>
                    </button>
                    <!-- Télécharger le ZIP de l'année -->
                    <button
                      class="btn btn-link text-success p-0"
                      title="Télécharger l'intégrale (ZIP)"
                      @click="downloadArchive(archive.nom)"
                    >
                      <i class="bi bi-download fs-5"></i>
                    </button>
                  </td>
                </tr>

                <!-- Liste vide -->
                <tr v-if="filteredArchives.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <h6 class="text-muted fw-bold">Aucune archive ne correspond à ces filtres</h6>
                    <p class="small text-muted mb-0">
                      Modifiez la catégorie ou l'année sélectionnée en haut de page.
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

// Filtres par défaut
const selectedAnnee = ref('2024-2025');
const filterCategorie = ref('');
const searchQuery = ref('');

// Données fictives d'archives sur plusieurs cycles passés
const mockArchives = ref([
  // Données pour l'année 2024-2025
  {
    id: 1,
    annee: '2024-2025',
    nom: 'PV_Notes_Finales_Toutes_Promotions',
    categorie: 'Notes & Procès-verbaux',
    reference: 'ARC-24-PV',
    dateCloture: '15/07/2025',
    taille: '14.5 Mo',
  },
  {
    id: 2,
    annee: '2024-2025',
    nom: 'Registres_Inscriptions_Etudiants',
    categorie: 'Étudiants & Classes',
    reference: 'ARC-24-REG',
    dateCloture: '30/09/2024',
    taille: '4.2 Mo',
  },
  {
    id: 3,
    annee: '2024-2025',
    nom: 'Supports_Cours_Et_Ressources_Master',
    categorie: 'Supports de Cours',
    reference: 'ARC-24-PEDAG',
    dateCloture: '20/07/2025',
    taille: '148.0 Mo',
  },

  // Données pour l'année 2023-2024
  {
    id: 4,
    annee: '2023-2024',
    nom: 'Historique_Emplois_Du_Temps_Et_Assignations',
    categorie: 'Assignations & Contrats',
    reference: 'ARC-23-PROP',
    dateCloture: '30/06/2024',
    taille: '2.8 Mo',
  },
  {
    id: 5,
    annee: '2023-2024',
    nom: 'PV_Deliberations_Jury_2024',
    categorie: 'Notes & Procès-verbaux',
    reference: 'ARC-23-PV',
    dateCloture: '12/07/2024',
    taille: '11.1 Mo',
  },
]);

// Filtrage intelligent combiné
const filteredArchives = computed(() => {
  return mockArchives.value.filter((arc) => {
    const matchesAnnee = arc.annee === selectedAnnee.value;
    const matchesCategorie =
      filterCategorie.value === '' || arc.categorie === filterCategorie.value;
    const matchesSearch = arc.nom.toLowerCase().includes(searchQuery.value.toLowerCase());

    return matchesAnnee && matchesCategorie && matchesSearch;
  });
});

// Actions de simulation
const viewArchive = (name) => {
  alert(`Ouverture sécurisée du dossier archivé (Lecture Seule) : ${name}`);
};

const downloadArchive = (name) => {
  alert(`Extraction et génération du package compressé pour : ${name}.zip`);
};
</script>

<style scoped>
/* Conteneur d'icône dossier Flat */
.folder-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Couleurs douces thématiques */
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.12);
  color: #ffc107;
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

/* Alignement avec les spécifications de ton UI (Flat Design) */
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
