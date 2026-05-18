<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Visualisation de l'Emploi du Temps</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-calendar3 me-1"></i>
        Consultez la grille horaire hebdomadaire dynamique par classe, formateur ou salle.
      </p>
    </div>

    <!-- Barre de filtres et de navigation -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-center">
            <!-- Navigation de la semaine -->
            <div class="col-md-4 d-flex align-items-center gap-2">
              <button class="btn btn-white btn-sm shadow-sm border" @click="changeSemaine(-1)">
                <i class="bi bi-chevron-left"></i>
              </button>
              <span class="fw-bold text-dark text-center flex-grow-1 small text-uppercase">
                Semaine du {{ formatSemaineHeader }}
              </span>
              <button class="btn btn-white btn-sm shadow-sm border" @click="changeSemaine(1)">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>

            <!-- Filtre principal : Classe ou Formateur -->
            <div class="col-md-3">
              <select class="form-select border-0 shadow-sm" v-model="viewType">
                <option value="classe">Vue par Classe</option>
                <option value="formateur">Vue par Formateur</option>
              </select>
            </div>

            <!-- Sélection de la cible selon la vue -->
            <div class="col-md-5">
              <select class="form-select border-0 shadow-sm" v-model="selectedTarget">
                <template v-if="viewType === 'classe'">
                  <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
                </template>
                <template v-else>
                  <option v-for="f in mockFormateurs" :key="f" :value="f">{{ f }}</option>
                </template>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grille de l'Emploi du Temps Hebdomadaire (Flat Timetable Grid) -->
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="table-responsive">
          <table class="table table-bordered timetable-grid mb-0 text-center align-middle">
            <!-- Entête : Jours de la semaine -->
            <thead class="bg-light">
              <tr>
                <th style="width: 10%;" class="py-3 border-0">Heures</th>
                <th v-for="jour in joursSemaine" :key="jour.key" style="width: 15%;" class="py-3 border-0">
                  <div class="fw-bold text-dark">{{ jour.nom }}</div>
                  <small class="text-muted fw-normal" style="font-size: 11px;">{{ jour.dateLabel }}</small>
                </th>
              </tr>
            </thead>

            <!-- Corps de la grille : Découpage par créneaux fixes -->
            <tbody>
              <tr v-for="slotTime in slotsHoraires" :key="slotTime.start">
                <!-- Colonne de l'heure -->
                <td class="bg-light fw-semibold text-secondary small py-4 border-start-0 border-end-0">
                  {{ slotTime.start }}<br><span class="text-muted fw-normal" style="font-size: 10px;">à {{ slotTime.end }}</span>
                </td>

                <!-- Contenu pour chaque jour -->
                <td v-for="jour in joursSemaine" :key="jour.key" class="timetable-cell p-2">
                  <!-- Recherche d'un cours correspondant au jour et à l'heure exacte -->
                  <div 
                    v-if="getCourseAt(jour.dateStr, slotTime.start)" 
                    class="course-card p-2 text-start rounded transition-all"
                    :class="getCourseColor(getCourseAt(jour.dateStr, slotTime.start).matiere)"
                    @click="openCourseDetails(getCourseAt(jour.dateStr, slotTime.start))"
                  >
                    <div class="fw-bold text-truncate custom-title mb-1">
                      {{ getCourseAt(jour.dateStr, slotTime.start).matiere }}
                    </div>
                    
                    <div class="small text-muted text-truncate mb-1" style="font-size: 11px;">
                      <i class="bi bi-person me-1"></i>
                      {{ viewType === 'classe' ? getCourseAt(jour.dateStr, slotTime.start).formateur : getCourseAt(jour.dateStr, slotTime.start).classe }}
                    </div>

                    <span class="badge bg-white text-dark border-0 shadow-xs px-2 py-1 fw-bold text-uppercase" style="font-size: 9px;">
                      <i class="bi bi-geo-alt-fill text-danger me-1"></i>{{ getCourseAt(jour.dateStr, slotTime.start).salle }}
                    </span>
                  </div>
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
import { ref, computed } from 'vue';

// Configuration de la navigation / Type de vue
const viewType = ref('classe');
const selectedTarget = ref('Master 1 Info');
const currentSemaineOffset = ref(0);

// Référentiels
const mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management']);
const mockFormateurs = ref(['Dupont Jean', 'Traoré Moussa', 'Alami Sanaa']);

// Découpage structurel des lignes de la grille (Créneaux standards ERP)
const slotsHoraires = ref([
  { start: '08:30', end: '11:30' },
  { start: '13:30', end: '16:30' },
  { start: '17:00', end: '20:00' }
]);

// Base de données dynamique des cours planifiés
const mockSchedules = ref([
  { id: 1, date: '2026-05-18', heureDebut: '08:30', classe: 'Master 1 Info', matiere: 'Frameworks Modernes (Vue.js 3 & Node)', formateur: 'Traoré Moussa', salle: 'Salle 102 (Labo)' },
  { id: 2, date: '2026-05-18', heureDebut: '13:30', classe: 'Master 1 Info', matiere: 'Conception orientée objet & Patterns', formateur: 'Dupont Jean', salle: 'Amphi A' },
  { id: 3, date: '2026-05-19', heureDebut: '08:30', classe: 'Master 2 Info', matiere: 'Deep Learning & Vision par ordinateur', formateur: 'Alami Sanaa', salle: 'Salle 102 (Labo)' },
  { id: 4, date: '2026-05-20', heureDebut: '13:30', classe: 'Master 1 Info', matiere: 'Frameworks Modernes (Vue.js 3 & Node)', formateur: 'Traoré Moussa', salle: 'Visioconférence' },
  { id: 5, date: '2026-05-21', heureDebut: '08:30', classe: 'Licence 3 Management', matiere: 'Méthodologies Agiles & Scrum Master', formateur: 'Dupont Jean', salle: 'Salle 204' }
]);

// Génération dynamique des dates de la semaine en cours d'affichage
const joursSemaine = computed(() => {
  const joursNoms = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const baseDate = new Date('2026-05-18'); // Point d'ancrage fixé en Mai 2026
  baseDate.setDate(baseDate.getDate() + (currentSemaineOffset.value * 7));

  return joursNoms.map((nom, index) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + index);
    
    return {
      nom: nom,
      dateLabel: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      dateStr: d.toISOString().split('T')[0]
    };
  });
});

const formatSemaineHeader = computed(() => {
  if (joursSemaine.value.length === 0) return '';
  return `${joursSemaine.value[0].dateLabel} 2026`;
});

// Récupération en cascade du cours à afficher dans une cellule spécifique
const getCourseAt = (dateStr, startHour) => {
  return mockSchedules.value.find(slot => {
    const matchDate = slot.date === dateStr;
    const matchHeure = slot.heureDebut === startHour;
    const matchTarget = viewType.value === 'classe' 
      ? slot.classe === selectedTarget.value 
      : slot.formateur === selectedTarget.value;

    return matchDate && matchHeure && matchTarget;
  });
};

// Attribution automatique de couleurs Flat (Pastel Soft) selon la matière
const getCourseColor = (matiere) => {
  if (matiere.includes('Frameworks')) return 'course-cyan';
  if (matiere.includes('Conception')) return 'course-purple';
  if (matiere.includes('Deep Learning')) return 'course-orange';
  if (matiere.includes('Agiles')) return 'course-green';
  return 'course-default';
};

// Navigation temporelle
const changeSemaine = (direction) => {
  currentSemaineOffset.value += direction;
};

// Action au clic sur une carte
const openCourseDetails = (course) => {
  alert(`Fiche de la séance :\nMatière : ${course.matiere}\nFormateur : ${course.formateur}\nClasse : ${course.classe}\nSalle : ${course.salle}`);
};
</script>

<style scoped>
/* Table structurelle de l'emploi du temps */
.timetable-grid {
  border-collapse: collapse;
}

.timetable-grid th {
  border-bottom: 2px solid #eef2f5 !important;
  font-size: 0.85rem;
}

.timetable-cell {
  background-color: #fafbfc;
  height: 90px;
  min-width: 140px;
  border: 1px solid #f1f5f9 !important;
}

/* Design des cartes de cours (Flat UI Style) */
.course-card {
  cursor: pointer;
  border-left: 4px solid #6c757d;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.course-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.custom-title {
  font-size: 0.8rem;
  line-height: 1.2;
}

/* Thématiques colorimétriques de vos cours */
.course-cyan { background-color: #ecf8ff; border-left-color: #03a9f4; color: #0277bd; }
.course-purple { background-color: #fbf2ff; border-left-color: #a855f7; color: #701a75; }
.course-orange { background-color: #fff7ed; border-left-color: #f97316; color: #9a3412; }
.course-green { background-color: #f0fdf4; border-left-color: #22c55e; color: #166534; }
.course-default { background-color: #f8f9fa; border-left-color: #6c757d; color: #333333; }

/* Réinitialisations conformes au style de l'ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.btn-white {
  background: #ffffff;
  color: #212529;
}
.form-select {
  font-size: 0.85rem;
}
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>