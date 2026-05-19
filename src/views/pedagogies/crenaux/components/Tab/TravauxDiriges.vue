<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Archives des Emplois du Temps</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-archive-fill me-1"></i>
        Consultez l'historique complet et immuable des plannings et des séances de cours des années académiques clôturées.
      </p>
    </div>

    <!-- Filtres et outils de recherche historique -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-center">
            <!-- Choix de l'année d'archive -->
            <div class="col-md-3">
              <label class="form-label small fw-semibold text-muted mb-1">Année Historique</label>
              <select class="form-select border-0 shadow-sm" v-model="selectedAnnee">
                <option value="2024-2025">Année 2024 / 2025</option>
                <option value="2023-2024">Année 2023 / 2024</option>
                <option value="2022-2023">Année 2022 / 2023</option>
              </select>
            </div>

            <!-- Recherche plein texte multicritère -->
            <div class="col-md-6">
              <label class="form-label small fw-semibold text-muted mb-1">Recherche globale</label>
              <div class="input-group bg-white rounded shadow-sm">
                <span class="input-group-text bg-white border-0">
                  <i class="bi bi-search text-warning"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-0"
                  placeholder="Rechercher par matière, classe, formateur ou salle..."
                  v-model="searchQuery"
                />
              </div>
            </div>

            <!-- Statut d'intégrité de l'archive -->
            <div class="col-md-3 text-md-end mt-4">
              <span class="badge bg-soft-secondary text-secondary px-3 py-2 rounded">
                <i class="bi bi-shield-lock-fill me-1"></i> Données Scellées
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau d'historique des séances -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="card-header bg-white border-0 pt-4 px-4 pb-2">
          <h5 class="fw-bold text-dark mb-0">
            <i class="bi bi-clock-history text-warning me-2"></i>Registre des Séances Clôturées — {{ selectedAnnee }}
          </h5>
        </div>

        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3">Date effective</th>
                  <th>Classe</th>
                  <th>Matière Enseignée</th>
                  <th>Formateur</th>
                  <th class="text-center">Salle occupée</th>
                  <th class="text-end pe-4">Statut d'émargement</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="slot in filteredArchives" :key="slot.id" class="transition-all">
                  <!-- Date et heure historique -->
                  <td class="ps-4">
                    <div class="fw-bold text-dark">{{ formatDate(slot.date) }}</div>
                    <small class="text-muted">
                      <i class="bi bi-clock me-1"></i>{{ slot.heureDebut }} - {{ slot.heureFin }}
                    </small>
                  </td>

                  <!-- Classe historique -->
                  <td>
                    <span class="badge bg-light text-secondary border px-2 py-1 fw-bold">{{ slot.classe }}</span>
                  </td>

                  <!-- Matière -->
                  <td class="fw-semibold text-dark">
                    {{ slot.matiere }}
                  </td>

                  <!-- Formateur de l'époque -->
                  <td class="text-secondary small">
                    <i class="bi bi-person me-1"></i> {{ slot.formateur }}
                  </td>

                  <!-- Salle occupée à l'époque -->
                  <td class="text-center">
                    <span class="badge bg-soft-warning text-warning px-3 py-2 fw-bold">
                      {{ slot.salle }}
                    </span>
                  </td>

                  <!-- Statut de l'archive (Présence/Émargements) -->
                  <td class="text-end pe-4">
                    <span class="badge bg-soft-success text-success rounded-pill px-3 py-1" style="font-size: 11px;">
                      <i class="bi bi-check-all me-1"></i> Émargé (100%)
                    </span>
                  </td>
                </tr>

                <!-- Cas de recherche sans résultats -->
                <tr v-if="filteredArchives.length === 0">
                  <td colspan="6" class="text-center py-5">
                    <h6 class="text-muted fw-bold mb-1">Aucune archive correspondante</h6>
                    <p class="small text-muted mb-0">Modifiez le mot-clé ou changez l'année historique ciblée.</p>
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

// États des filtres historiques
const selectedAnnee = ref('2024-2025');
const searchQuery = ref('');

// Base de données historique des séances (Mock Data)
const mockScheduleArchives = ref([
  // Données de l'année 2024-2025
  { id: 5001, annee: '2024-2025', date: '2025-02-10', heureDebut: '08:30', heureFin: '11:30', classe: 'Master 1 Info', matiere: 'Algorithmique et Complexité', formateur: 'Dupont Jean', salle: 'Amphi B' },
  { id: 5002, annee: '2024-2025', date: '2025-02-12', heureDebut: '13:30', heureFin: '16:30', classe: 'Master 1 Info', matiere: 'Bases de Données NoSQL', formateur: 'Traoré Moussa', salle: 'Salle 102 (Labo)' },
  { id: 5003, annee: '2024-2025', date: '2025-03-04', heureDebut: '17:00', heureFin: '20:00', classe: 'Licence 3 Management', matiere: 'Gestion de Projet Traditionnelle', formateur: 'Alami Sanaa', salle: 'Salle 204' },
  
  // Données de l'année 2023-2024
  { id: 6001, annee: '2023-2024', date: '2024-01-15', heureDebut: '09:00', heureFin: '12:00', classe: 'Master 2 Info', matiere: 'Systèmes Distribués & Cloud', formateur: 'Traoré Moussa', salle: 'Amphi A' }
]);

// Filtrage combiné : Année historique sélectionnée + recherche par mot-clé (Classe, Matière, Formateur ou Salle)
const filteredArchives = computed(() => {
  return mockScheduleArchives.value.filter(slot => {
    const matchAnnee = slot.annee === selectedAnnee.value;
    
    const term = searchQuery.value.toLowerCase();
    const matchTerm = 
      slot.classe.toLowerCase().includes(term) ||
      slot.matiere.toLowerCase().includes(term) ||
      slot.formateur.toLowerCase().includes(term) ||
      slot.salle.toLowerCase().includes(term);

    return matchAnnee && matchTerm;
  });
});

// Formatage de la date historique en format lisible (ex: Lun. 10 févr.)
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
</script>

<style scoped>
/* Teintes douces pour respecter ton Flat Design */
.bg-soft-warning { background-color: rgba(255, 193, 7, 0.12); color: #ffc107; }
.bg-soft-success { background-color: rgba(40, 167, 69, 0.12); color: #28a745; }
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

/* Alignement avec la charte structurelle de l'ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select, .form-control {
  font-size: 0.85rem;
  padding: 8px 12px;
}
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>