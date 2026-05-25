<template>
  <div class="container-fluid py-4 animate__animated animate__fadeIn">
    
    <!-- En-tête de la page -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h4 class="fw-bold text-dark mb-1">
          <i class="bi bi-clock-history text-secondary me-2"></i>Journal d'Audit & Historique
        </h4>
        <p class="text-muted small mb-0">
          Consultez la traçabilité complète des modifications de notes, publications de PV et actions administratives.
        </p>
      </div>

      <!-- Actions de rafraîchissement rapide -->
      <button class="btn btn-sm btn-white border text-secondary d-inline-flex align-items-center gap-1.5" @click="refreshLogs">
        <i class="bi bi-arrow-clockwise"></i>
        <span>Actualiser les logs</span>
      </button>
    </div>

    <!-- Filtres Avancés de Recherche -->
    <div class="card border shadow-sm rounded-3 mb-4 bg-white">
      <div class="card-body p-3">
        <div class="row g-2">
          <!-- Recherche par mot-clé (Utilisateur, Candidat, Action) -->
          <div class="col-12 col-md-4">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light text-muted border-end-0">
                <i class="bi bi-search"></i>
              </span>
              <input 
                v-model="filters.search" 
                type="text" 
                class="form-control form-control-sm border-start-0" 
                placeholder="Rechercher un auteur, une cible, une table..." 
              />
            </div>
          </div>

          <!-- Filtre par Niveau de Gravité / Type d'Action -->
          <div class="col-12 class col-sm-6 col-md-3">
            <select v-model="filters.severity" class="form-select form-select-sm fw-medium text-secondary">
              <option value="">Toutes les actions</option>
              <option value="CRITICAL">Critiques (Modifications, Suppressions)</option>
              <option value="INFO">Informations (Publications, Consultations)</option>
            </select>
          </div>

          <!-- Filtre par Module Impacté -->
          <div class="col-12 col-sm-6 col-md-3">
            <select v-model="filters.module" class="form-select form-select-sm fw-medium text-secondary">
              <option value="">Tous les modules</option>
              <option value="Saisie de notes">Saisie de notes</option>
              <option value="Délibération">Délibération</option>
              <option value="Candidatures">Candidatures</option>
            </select>
          </div>

          <!-- Bouton de réinitialisation des filtres -->
          <div class="col-12 col-md-2 d-grid">
            <button class="btn btn-sm btn-light border text-dark fw-medium" @click="resetFilters">
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline / Liste Linéaire des Événements -->
    <div class="card border shadow-sm rounded-3 bg-white">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 text-sm">
            <thead class="table-light text-uppercase font-monospace text-xs">
              <tr>
                <th class="ps-4" style="width: 18%">Horodatage</th>
                <th style="width: 15%">Utilisateur</th>
                <th style="width: 15%">Module</th>
                <th style="width: 37%">Action effectuée</th>
                <th class="text-end pe-4" style="width: 15%">Adresse IP</th>
              </tr>
            </thead>
            
            <tbody>
              <tr v-for="log in filteredLogs" :key="log.id" :class="{'table-warning-subtle': log.severite === 'CRITICAL'}">
                <!-- Horodatage complet -->
                <td class="ps-4 font-monospace text-xs text-secondary">
                  <span class="d-block fw-bold text-dark">{{ formatTime(log.date) }}</span>
                  <span>{{ formatDate(log.date) }}</span>
                </td>

                <!-- Auteur de l'action -->
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-placeholder font-monospace text-uppercase shadow-sm">
                      {{ log.utilisateur.substring(0, 2) }}
                    </div>
                    <div>
                      <span class="fw-semibold text-dark d-block mb-0">{{ log.utilisateur }}</span>
                      <small class="text-xs text-muted font-monospace">{{ log.role }}</small>
                    </div>
                  </div>
                </td>

                <!-- Module -->
                <td>
                  <span class="badge bg-light text-dark border font-monospace text-xs">
                    {{ log.module }}
                  </span>
                </td>

                <!-- Description de l'action & Détails log_jsonb -->
                <td>
                  <div class="text-dark fw-medium mb-0 line-clamp-2">
                    <!-- Icone de Criticité -->
                    <i v-if="log.severite === 'CRITICAL'" class="bi bi-shield-fill-exclamation text-warning me-1.5" title="Action sensible"></i>
                    <span>{{ log.description }}</span>
                  </div>
                  <!-- Métadonnées additionnelles issues du champ JSONB -->
                  <small v-if="log.details" class="text-xs text-muted font-monospace bg-light px-1.5 py-0.5 rounded d-inline-block mt-1">
                    {{ log.details }}
                  </small>
                </td>

                <!-- IP de connexion -->
                <td class="text-end pe-4 font-monospace text-xs text-muted">
                  {{ log.ip }}
                </td>
              </tr>

              <!-- Log vide -->
              <tr v-if="filteredLogs.length === 0">
                <td colspan="5" class="text-center text-muted py-5">
                  <i class="bi bi-calendar-x display-6 text-muted d-block mb-2"></i>
                  Aucun événement enregistré ne correspond aux critères.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotifier } from '@/stores/messages/useNotifier';

const { notifySuccess } = useNotifier();

// Tableau vide par défaut
const logs = ref([]);
const filters = ref({ search: '', severity: '', module: '' });

onMounted(() => {
  loadLogs();
});

const loadLogs = async () => {
  try {
    // Ici tu peux appeler ton API pour récupérer les logs
    // Exemple : logs.value = await api.get('/audit/logs');
    // Pour l’instant, on laisse vide par défaut
    logs.value = [];
  } catch (err) {
    console.error(err);
  }
};

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchSearch = !filters.value.search || 
      log.utilisateur.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      log.description.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(filters.value.search.toLowerCase()));

    const matchSeverity = !filters.value.severity || log.severite === filters.value.severity;
    const matchModule = !filters.value.module || log.module === filters.value.module;

    return matchSearch && matchSeverity && matchModule;
  });
});

const formatTime = (isoString) => {
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const resetFilters = () => {
  filters.value = { search: '', severity: '', module: '' };
};

const refreshLogs = () => {
  loadLogs();
  notifySuccess('Le journal des logs a été mis à jour.');
};
</script>



<style scoped>
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }

/* Mini conteneur d'initiales pour l'avatar de l'opérateur */
.avatar-placeholder {
  width: 32px;
  height: 32px;
  background-color: #f1f5f9;
  color: #475569;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid #e2e8f0;
}

.table-warning-subtle {
  background-color: rgba(255, 193, 7, 0.03) !important;
}

.table-warning-subtle:hover {
  background-color: rgba(255, 193, 7, 0.06) !important;
}

.gap-1\.5 { gap: 0.375rem; }
.me-1\.5 { margin-right: 0.375rem; }
.px-1\.5 { padding-left: 0.375rem; padding-right: 0.375rem; }
</style>