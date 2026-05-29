<template>
  <div class="row align-items-center mb-3">
    <div class="col-md-8">
      <h4 class="fw-bold text-dark mb-1">Planification Évaluations</h4>
      <p class="text-muted small mb-0">
        Visualisation et gestion chronologique des Examens Normaux et Rattrapages.
      </p>
    </div>
  </div>

  <div class="card border-0 shadow-sm p-3 mb-4 bg-white">
    <div class="row g-3">
      <div class="col-12 col-sm-6 col-md-3">
        <label class="form-label text-xs fw-semibold text-muted mb-1">Filière</label>
        <select
          v-model="filters.filiereId"
          class="form-select form-select-sm text-secondary"
          @change="onFiliereChange"
        >
          <option value="">Toutes les filières</option>
          <option v-for="filiere in filieres" :key="filiere.id" :value="filiere.id">
            {{ filiere.nom }}
          </option>
        </select>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <label class="form-label text-xs fw-semibold text-muted mb-1">Classe</label>
        <select
          v-model="filters.classeId"
          class="form-select form-select-sm text-secondary"
          :disabled="!filters.filiereId"
        >
          <option value="">Toutes les classes</option>
          <option v-for="classe in filteredClasses" :key="classe.id" :value="classe.id">
            {{ classe.code }} - {{ classe.niveau }}
          </option>
        </select>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <label class="form-label text-xs fw-semibold text-muted mb-1">Type d'épreuve</label>
        <select v-model="filters.typeEval" class="form-select form-select-sm text-secondary">
          <option value="">Tous les types</option>
          <option value="NORMAL">Session Normale</option>
          <option value="RATTRAPAGE">Rattrapage</option>
        </select>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <label class="form-label text-xs fw-semibold text-muted mb-1">Recherche rapide</label>
        <div class="input-group input-group-sm">
          <span class="input-group-text bg-white"><i class="bi bi-search text-muted"></i></span>
          <input
            v-model="filters.search"
            type="text"
            class="form-control"
            placeholder="Salle, code matière..."
          />
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-md-12">
      <div class="card border-0 shadow-sm bg-white">
        <div
          class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center"
        >
          <h6 class="fw-bold text-dark mb-0">
            <i class="bi bi-calendar3 me-2 text-primary"></i>Planning des épreuves planifiées
          </h6>
          <span class="badge bg-primary-subtle text-primary text-xs px-2 py-1">
            {{ filteredEvents.length }} Épreuve(s) trouvée(s)
          </span>
        </div>

        <div class="card-body p-0">
          <div v-if="filteredEvents.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-calendar-x d-block mb-3 fs-1 text-secondary"></i>
            <h5 class="fw-bold">Aucune épreuve planifiée</h5>
            <p class="small max-w-sm mx-auto">
              Aucun examen ou rattrapage ne correspond aux critères de recherche ou n'a encore été
              généré pour cette session.
            </p>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-sm">
              <thead class="table-light text-secondary text-uppercase text-xs">
                <tr>
                  <th class="ps-4">Date & Heure</th>
                  <th>Classe</th>
                  <th>Matière</th>
                  <th>Type</th>
                  <th>Durée</th>
                  <th>Salle / Lieu</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="event in sortedEvents"
                  :key="event.id"
                  :class="{ 'table-warning-subtle': event.type === 'RATTRAPAGE' }"
                >
                  <td class="ps-4">
                    <div class="fw-bold text-dark">{{ formatDate(event.date) }}</div>
                    <small class="text-muted">
                      <i class="bi bi-clock me-1"></i>{{ event.heure_debut }}
                    </small>
                  </td>

                  <td>
                    <span class="badge bg-light text-dark border fw-medium">
                      {{ event.classeCode }}
                    </span>
                  </td>

                  <td>
                    <div class="fw-semibold text-dark">{{ event.moduleNom }}</div>
                    <small class="text-muted font-monospace text-xs">{{ event.moduleCode }}</small>
                  </td>

                  <td>
                    <span
                      class="badge text-xs"
                      :class="
                        event.type === 'NORMAL'
                          ? 'bg-success-subtle text-success'
                          : 'bg-warning-subtle text-warning'
                      "
                    >
                      {{ event.type === 'NORMAL' ? 'Session Normale' : 'Rattrapage' }}
                    </span>
                  </td>

                  <td>{{ event.duree }} min</td>

                  <td>
                    <span v-if="event.salle" class="text-dark fw-medium">
                      <i class="bi bi-geo-alt me-1 text-danger"></i>{{ event.salle }}
                    </span>
                    <span v-else class="text-muted text-xs italic">Non spécifiée</span>
                  </td>

                  <td class="text-end pe-4">
                    <button
                      class="btn btn-outline-primary btn-xs me-1"
                      @click="editEvent(event)"
                      title="Modifier"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      class="btn btn-outline-danger btn-xs"
                      @click="deleteEvent(event)"
                      title="Annuler l'épreuve"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
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
import { ref, computed, onMounted } from 'vue';

import { useNotifier } from '@/stores/messages/useNotifier';

const { notifySuccess, notifyError } = useNotifier();

// Structures de données académiques
const filieres = ref([]);
const allClasses = ref([]);
const calendarEvents = ref([]); // Liste brute de toutes les épreuves planifiées

const filters = ref({
  filiereId: '',
  classeId: '',
  typeEval: '',
  search: '',
});

onMounted(async () => {
  await fetchAcademicStructures();
  await fetchCalendarEvents();
});

const fetchAcademicStructures = async () => {
  // Données de structures (Synchronisées avec votre arborescence globale)
  filieres.value = [
    { id: 'f1', nom: 'Génie Logiciel' },
    { id: 'f2', nom: 'Systèmes & Réseaux' },
  ];

  allClasses.value = [
    { id: 'c1', filiere_id: 'f1', code: 'L3GL', niveau: 'Licence 3' },
    { id: 'c2', filiere_id: 'f1', code: 'M1GL', niveau: 'Master 1' },
    { id: 'c3', filiere_id: 'f2', code: 'L3SR', niveau: 'Licence 3' },
  ];
};

const fetchCalendarEvents = async () => {
  // Simulation de la récupération de la planification globale de la session (Examens et Rattrapages)
  calendarEvents.value = [
    {
      id: 'ev1',
      classeId: 'c1',
      classeCode: 'L3GL',
      filiereId: 'f1',
      moduleCode: 'INF110',
      moduleNom: 'Algorithmique et Structures de Données',
      type: 'NORMAL',
      date: '2026-06-05',
      heure_debut: '08:30',
      duree: 120,
      salle: 'Amphi A',
    },
    {
      id: 'ev2',
      classeId: 'c1',
      classeCode: 'L3GL',
      filiereId: 'f1',
      moduleCode: 'MTH111',
      moduleNom: 'Analyse Mathématique I',
      type: 'NORMAL',
      date: '2026-06-08',
      heure_debut: '14:00',
      duree: 90,
      salle: 'Salle 102',
    },
    {
      id: 'ev3',
      classeId: 'c2',
      classeCode: 'M1GL',
      filiereId: 'f1',
      moduleCode: 'INF112',
      moduleNom: 'Systèmes d’Exploitation & Linux',
      type: 'RATTRAPAGE',
      date: '2026-06-20',
      heure_debut: '09:00',
      duree: 120,
      salle: 'Amphi B',
    },
  ];
};

/* =========================================================================
    ⚙️ LOGIQUE RÉACTIVE DU CALENDRIER
   ========================================================================= */

// Filtrage en cascade des classes
const filteredClasses = computed(() => {
  if (!filters.value.filiereId) return [];
  return allClasses.value.filter((c) => c.filiere_id === filters.value.filiereId);
});

const onFiliereChange = () => {
  filters.value.classeId = '';
};

// Filtrage multi-critères des épreuves du calendrier
const filteredEvents = computed(() => {
  return calendarEvents.value.filter((event) => {
    const matchFiliere = !filters.value.filiereId || event.filiereId === filters.value.filiereId;
    const matchClasse = !filters.value.classeId || event.classeId === filters.value.classeId;
    const matchType = !filters.value.typeEval || event.type === filters.value.typeEval;

    // Recherche textuelle (Salle, Nom ou Code matière)
    const searchLower = filters.value.search.toLowerCase();
    const matchSearch =
      !filters.value.search ||
      event.moduleNom.toLowerCase().includes(searchLower) ||
      event.moduleCode.toLowerCase().includes(searchLower) ||
      (event.salle && event.salle.toLowerCase().includes(searchLower));

    return matchFiliere && matchClasse && matchType && matchSearch;
  });
});

// Tri chronologique des épreuves (Date puis Heure)
const sortedEvents = computed(() => {
  return [...filteredEvents.value].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.heure_debut}`);
    const dateB = new Date(`${b.date}T${b.heure_debut}`);
    return dateA - dateB;
  });
});

/* =========================================================================
    🚀 ACTIONS UTILISATEUR
   ========================================================================= */
const editEvent = (event) => {
  // Logique pour ouvrir un modal de modification rapide d'horaire ou de salle
  console.log("Modification de l'épreuve:", event);
};

const deleteEvent = (event) => {
  if (confirm(`Voulez-vous vraiment annuler l'épreuve de ${event.moduleNom} ?`)) {
    calendarEvents.value = calendarEvents.value.filter((ev) => ev.id !== event.id);
    notifySuccess('Épreuve retirée du calendrier avec succès.');
  }
};

const refreshCalendar = async () => {
  await fetchCalendarEvents();
  notifySuccess('Calendrier actualisé.');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
</script>

<style scoped>
.text-xs {
  font-size: 0.75rem;
}
.btn-xs {
  padding: 0.25rem 0.4rem;
  font-size: 0.75rem;
  border-radius: 0.2rem;
}
.table-warning-subtle {
  background-color: rgba(255, 193, 7, 0.05);
}
</style>
