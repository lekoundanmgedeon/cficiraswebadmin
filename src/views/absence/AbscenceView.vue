<template>
  <div>
    <div class="row">
      <div class="col-md-12 grid-margin">
        <div class="d-flex justify-content-between flex-wrap">
          <div class="d-flex align-items-end flex-wrap">
            <div class="me-md-3 me-xl-5">
              <h2>Gestion des Présences</h2>
              <p class="mb-md-0 text-muted">
                Contrôle des absences et émargement quotidien des étudiants.
              </p>
            </div>
            <div class="d-flex civ-breadcrumbs">
              <i class="mdi mdi-home text-muted hover-cursor"></i>
              <p class="text-muted mb-0 hover-cursor">&nbsp;/&nbsp;scolarite&nbsp;/&nbsp;</p>
              <p class="text-primary mb-0 hover-cursor">Presences</p>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-end flex-wrap">
            <button
              class="btn btn-sm btn-outline-success d-flex align-items-center gap-1 shadow-sm"
            >
              <i class="mdi mdi-chart-bar"></i>
              <span>Rapport Mensuel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="container my-2">
        <div class="col-md-12 grid margin stretch-card">
          <div class="card">
            <div class="card-body">
              <div class="row">
                <div class="container-fluid my-2">
                  <div class="col-md-12 grid-margin stretch-card">
                    <div class="card border-0 shadow-sm">
                      <div class="card-body">
                        <h5 class="fw-bold mb-3 text-dark">
                          <i class="mdi mdi-filter-variant me-2 text-primary"></i>1. Sélectionner la
                          session de cours
                        </h5>
                        <div class="row g-3">
                          <div class="col-md-3">
                            <label class="small fw-semibold text-muted mb-1">Date du jour</label>
                            <input
                              type="date"
                              v-model="filterDate"
                              class="form-select border shadow-sm"
                            />
                          </div>
                          <div class="col-md-3">
                            <label class="small fw-semibold text-muted mb-1">Classe / Niveau</label>
                            <select v-model="selectedClasse" class="form-select border shadow-sm">
                              <option value="">Choisir une classe...</option>
                              <option v-for="c in classes" :key="c" :value="c">{{ c }}</option>
                            </select>
                          </div>
                          <div class="col-md-3">
                            <label class="small fw-semibold text-muted mb-1"
                              >Cours / Enseignement</label
                            >
                            <select
                              v-model="selectedCours"
                              class="form-select border shadow-sm"
                              :disabled="!selectedClasse"
                            >
                              <option value="">Choisir un cours...</option>
                              <option v-for="m in matieres" :key="m" :value="m">{{ m }}</option>
                            </select>
                          </div>
                          <div class="col-md-3">
                            <label class="small fw-semibold text-muted mb-1">Créneau horaire</label>
                            <select v-model="selectedSlot" class="form-select border shadow-sm">
                              <option value="M1">08h00 - 10h00</option>
                              <option value="M2">10h15 - 12h15</option>
                              <option value="A1">14h00 - 16h00</option>
                              <option value="A2">16h15 - 18h15</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row" v-if="selectedClasse && selectedCours">
                <div class="col-md-12 grid-margin stretch-card">
                  <div class="card border-0 shadow-sm">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h4 class="card-title mb-1">Fiche d'Émargement numérique</h4>
                          <p class="card-description mb-0 text-muted">
                            Classe : <span class="fw-bold text-dark">{{ selectedClasse }}</span> |
                            Cours :
                            <span class="fw-bold text-dark">{{ selectedCours }}</span>
                          </p>
                        </div>
                        <button
                          @click="markAllAsPresent"
                          class="btn btn-sm btn-light border text-success fw-semibold"
                        >
                          <i class="mdi mdi-check-all me-1"></i> Tout cocher "Présent"
                        </button>
                      </div>

                      <div class="table-responsive">
                        <table class="table table-hover align-middle">
                          <thead class="table-light">
                            <tr>
                              <th style="width: 15%">Matricule</th>
                              <th style="width: 35%">Nom & Prénoms</th>
                              <th class="text-center" style="width: 35%">Statut de présence</th>
                              <th style="width: 15%">Justificatif / Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="etudiant in etudiantsList" :key="etudiant.id">
                              <td class="font-monospace fw-semibold text-secondary">
                                {{ etudiant.matricule }}
                              </td>
                              <td>
                                <div class="fw-bold text-dark">
                                  {{ etudiant.nom }} {{ etudiant.prenom }}
                                </div>
                              </td>
                              <td class="text-center">
                                <div class="btn-group btn-group-sm" role="group">
                                  <input
                                    type="radio"
                                    :name="'status-' + etudiant.id"
                                    value="present"
                                    v-model="etudiant.statut"
                                    :id="'pres-' + etudiant.id"
                                    class="btn-check"
                                  />
                                  <label
                                    class="btn btn-outline-success px-3"
                                    :for="'pres-' + etudiant.id"
                                  >
                                    <i class="mdi mdi-check-circle-outline me-1"></i>Présent
                                  </label>

                                  <input
                                    type="radio"
                                    :name="'status-' + etudiant.id"
                                    value="retard"
                                    v-model="etudiant.statut"
                                    :id="'ret-' + etudiant.id"
                                    class="btn-check"
                                  />
                                  <label
                                    class="btn btn-outline-warning px-3"
                                    :for="'ret-' + etudiant.id"
                                  >
                                    <i class="mdi mdi-clock-outline me-1"></i>Retard
                                  </label>

                                  <input
                                    type="radio"
                                    :name="'status-' + etudiant.id"
                                    value="absent"
                                    v-model="etudiant.statut"
                                    :id="'abs-' + etudiant.id"
                                    class="btn-check"
                                  />
                                  <label
                                    class="btn btn-outline-danger px-3"
                                    :for="'abs-' + etudiant.id"
                                  >
                                    <i class="mdi mdi-close-circle-outline me-1"></i>Absent
                                  </label>
                                </div>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  v-model="etudiant.commentaire"
                                  placeholder="Ex: Certificat médical..."
                                  class="form-control form-control-sm border"
                                  :disabled="
                                    etudiant.statut !== 'absent' && etudiant.statut !== 'retard'
                                  "
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div class="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button
                          @click="validerFeuilleAppel"
                          class="btn btn-primary px-4 shadow-sm"
                          :disabled="saving"
                        >
                          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                          <i v-else class="mdi mdi-cloud-upload me-2"></i>
                          Enregistrer l'émergement
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row" v-else>
                <div class="col-12 text-center py-5 text-muted">
                  <i class="mdi mdi-account-search mdi-48px text-primary opacity-50"></i>
                  <p class="mt-2 fs-5 fw-medium">
                    Veuillez sélectionner une classe et un cours pour générer la fiche d'appel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// États réactifs des filtres (initialisés par défaut)
const filterDate = ref(new Date().toISOString().split('T')[0]); // Date du jour
const selectedClasse = ref('');
const selectedCours = ref('');
const selectedSlot = ref('M1');
const saving = ref(false);

// Listes fictives pour alimenter vos sélecteurs
const classes = ref(['Licence 1 - INF', 'Licence 2 - INF', 'Licence 3 - INF', 'Master 1 - MNG']);
const matieres = ref([
  'Algorithmique avancée',
  'Développement Web (Vue.js)',
  'Bases de données SQL',
  'Réseaux & Sécurité',
]);

// Simulation de la liste d'étudiants chargée dynamiquement selon la classe choisie
const etudiantsList = ref([
  {
    id: 101,
    matricule: 'ETU-2026-01',
    nom: 'DIOP',
    prenom: 'Moussa',
    statut: 'present',
    commentaire: '',
  },
  {
    id: 102,
    matricule: 'ETU-2026-02',
    nom: 'KANE',
    prenom: 'Awa',
    statut: 'present',
    commentaire: '',
  },
  {
    id: 103,
    matricule: 'ETU-2026-03',
    nom: 'NFAH',
    prenom: 'Jean',
    statut: 'absent',
    commentaire: '',
  },
  {
    id: 104,
    matricule: 'ETU-2026-04',
    nom: 'SOW',
    prenom: 'Fatoumata',
    statut: 'present',
    commentaire: '',
  },
]);

// Fonction utilitaire : cocher tout le monde présent par défaut
const markAllAsPresent = () => {
  etudiantsList.value.forEach((etudiant) => {
    etudiant.statut = 'present';
  });
};

// Fonction de soumission de la fiche vers votre API ou Store
const validerFeuilleAppel = async () => {
  saving.value = true;

  // Modèle de payload prêt pour l'envoi
  const payload = {
    date: filterDate.value,
    classe: selectedClasse.value,
    cours: selectedCours.value,
    creneau: selectedSlot.value,
    registre: etudiantsList.value.map((e) => ({
      student_id: e.id,
      statut: e.statut,
      commentaire: e.commentaire,
    })),
  };

  console.log('Données envoyées :', payload);

  // Simulation réseau
  setTimeout(() => {
    saving.value = false;
    alert("Fiche d'émergement enregistrée avec succès !");
  }, 1000);
};
</script>

<style scoped>
body {
  background-color: #f8f9fa;
  color: #212529;
}
.card {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
}
.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}
.btn-primary:hover {
  background-color: #0056b3;
  border-color: #004080;
}

.btn-check:checked + .btn-outline-success {
  background-color: var(--bs-success);
  color: white;
}
.btn-check:checked + .btn-outline-warning {
  background-color: var(--bs-warning);
  color: #212529;
}
.btn-check:checked + .btn-outline-danger {
  background-color: var(--bs-danger);
  color: white;
}
.gap-1 {
  gap: 0.25rem;
}
.gap-2 {
  gap: 0.5rem;
}
</style>
