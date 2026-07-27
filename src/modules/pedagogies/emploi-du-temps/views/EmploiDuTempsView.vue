<template>
  <div>
    <div class="row">
      <div class="col-md-12 grid-margin">
        <div class="d-flex justify-content-between flex-wrap">
          <div class="d-flex align-items-end flex-wrap">
            <div class="me-md-3 me-xl-5">
              <h2>Emploi du temps</h2>
              <p class="mb-md-0">Vue générale — tous cycles, filières et classes</p>
            </div>
            <div class="d-flex">
              <i class="mdi mdi-home text-muted hover-cursor"></i>
              <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;Emploi du temps&nbsp;/&nbsp;</p>
              <p class="text-primary mb-0 hover-cursor">Vue générale</p>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-end flex-wrap gap-2">
            <ExportMenu @excel="exportToExcel" @pdf="exportToPdf" />
            <RouterLink to="/crenaux-horaires" class="btn btn-primary mt-2 mt-xl-0">
              <i class="mdi mdi-pencil me-1"></i> Planifier des créneaux
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title">Planning journalier & hebdomadaire</h4>
            <p class="text-muted small">
              Les créneaux de toutes les classes, pour l'année académique choisie.
            </p>

            <FiltresEmploiDuTemps :filtres="filtres" @changer="store.appliquerFiltres($event)" />

            <!-- Compteurs du périmètre courant : ils disent d'un coup d'œil si
                 un filtre est trop étroit, avant même de lire la grille. -->
            <div class="d-flex flex-wrap gap-3 mb-3">
              <span class="badge bg-soft-primary text-primary text-xs">
                {{ resume.creneaux }} créneau(x)
              </span>
              <span class="badge bg-soft-success text-success text-xs">
                {{ resume.classes }} classe(s)
              </span>
              <span class="badge bg-soft-warning text-warning text-xs">
                {{ resume.filieres }} filière(s)
              </span>
              <span class="badge bg-light text-dark text-xs">
                {{ resume.enseignants }} formateur(s)
              </span>
            </div>

            <LoadingSpinner v-if="loading && estVide" />
            <AppTabs v-else :tabs="tabs" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';
import AppTabs from '@/shared/components/AppTabs.vue';
import ExportMenu from '@/shared/components/ExportMenu.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { useTableExport } from '@/shared/composables/useTableExport';
import FiltresEmploiDuTemps from '../components/FiltresEmploiDuTemps.vue';
import GrilleJours from '../components/GrilleJours.vue';
import VueParCycle from '../components/VueParCycle.vue';
import { useEmploiDuTempsStore } from '../store';
import { libelleJour, plageHoraire } from '../constants';

/**
 * Emploi du temps général.
 *
 * L'écran d'origine (`views/schedule/`, 4 fichiers) **n'était relié à rien** :
 * ses trois filtres servaient des `<option>` codés en dur — « 2022-2023 »,
 * « Informatique », « LAP 1 », des valeurs qui n'existent nulle part en base —
 * et son tableau affichait « Aucune donnée » pour chaque jour, en dur également.
 * Aucun store, aucun appel API.
 *
 * Il n'était par ailleurs **atteignable par aucune route** : la barre latérale
 * pointait vers `/schedule`, un chemin qui n'était déclaré nulle part. Le lien
 * menait donc à la page « introuvable ».
 *
 * La saisie des créneaux reste dans `pedagogies/crenaux` : cet écran-ci est en
 * lecture seule et renvoie vers l'autre pour planifier.
 */
const store = useEmploiDuTempsStore();
const { filtres, loading, estVide, resume, creneaux } = storeToRefs(store);

const tabs = [
  { id: 'jours', label: 'Par jour', component: GrilleJours },
  { id: 'cycles', label: 'Par cycle & filière', component: VueParCycle },
];

const { exportToExcel, exportToPdf } = useTableExport({
  rows: computed(() =>
    creneaux.value.map((creneau) => ({
      Jour: libelleJour(creneau.jour),
      Horaire: plageHoraire(creneau),
      Cycle: creneau.cycle_code ?? '',
      Filière: creneau.filiere ?? '',
      Classe: creneau.classe_code ?? '',
      Semestre: creneau.semestre ?? '',
      Type: creneau.type_cours ?? '',
      Matière: creneau.nom_module ?? '',
      Formateur: creneau.enseignant ?? '',
      Salle: creneau.salle_nom ?? creneau.code_salle ?? '',
    }))
  ),
  title: 'Emploi du temps général',
  fileBaseName: 'emploi_du_temps',
});

onMounted(() => store.fetchCreneaux());
</script>

<style scoped>
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}

.text-xs {
  font-size: 11px !important;
}
</style>
