<template>
  <div class="row">
    <!-- Header de la section -->
    <div class="col-12 mb-4">
      <h3 class="fw-bold mb-1">Bulletins & Documents Officiels</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-file-earmark-pdf-fill me-1"></i>
        Générez, prévisualisez et exportez les relevés de notes semestriels et les attestations de
        réussite certifiées.
      </p>
    </div>

    <!-- Sélecteur de Promotion et Actions de Masse -->
    <div class="col-12 mb-4">
      <div class="card border-0 shadow-sm bg-light rounded-4">
        <div class="card-body p-3">
          <div class="row g-3 align-items-center">
            <!-- Choix de la classe -->
            <div class="col-md-3">
              <select
                class="form-select border-0 shadow-sm"
                v-model="selectedClasse"
                @change="loadPromotion"
              >
                <option value="">Sélectionner une promotion...</option>
                <option v-for="c in mockClasses" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <!-- Choix du document -->
            <div class="col-md-3">
              <select
                class="form-select border-0 shadow-sm"
                v-model="documentType"
                :disabled="!selectedClasse"
              >
                <option value="Relevé de Notes">Relevé de Notes (Semestriel)</option>
                <option value="Attestation">Attestation de Réussite</option>
              </select>
            </div>
            <!-- Export groupé -->
            <div class="col-md-6 text-md-end">
              <button
                class="btn btn-primary border-0 shadow-sm px-3 py-2 text-white"
                :disabled="!selectedClasse"
                @click="exportBulkPDF"
              >
                <i class="bi bi-download me-1"></i> Télécharger les packages (PDF ZIP)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Corps principal : Liste à gauche, Aperçu du document à droite -->
    <div class="col-md-4 mb-4" v-if="selectedClasse && students.length > 0">
      <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div class="card-header bg-white border-0 pt-3 px-3 pb-2">
          <h6 class="fw-bold text-muted small text-uppercase mb-0">Étudiants de la promotion</h6>
        </div>
        <div class="list-group list-group-flush">
          <button
            v-for="student in students"
            :key="student.matricule"
            type="button"
            class="list-group-item list-group-item-action border-0 px-3 py-2 d-flex justify-content-between align-items-center text-start"
            :class="
              activeStudent?.matricule === student.matricule
                ? 'bg-soft-primary fw-bold text-primary'
                : ''
            "
            @click="selectStudent(student)"
          >
            <div>
              <span class="d-block text-dark">{{ student.nom }}</span>
              <small class="text-muted font-monospace" style="font-size: 11px">{{
                student.matricule
              }}</small>
            </div>
            <span
              class="badge rounded-pill text-xs"
              :class="
                student.statut === 'Admis'
                  ? 'bg-soft-success text-success'
                  : 'bg-soft-danger text-danger'
              "
            >
              {{ student.moyenne }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Zone d'Aperçu du Bulletin (Template Officiel) -->
    <div class="col-md-8 mb-4" v-if="activeStudent && selectedClasse">
      <div class="card border-0 shadow-sm rounded-4 bg-white p-4 position-relative">
        <!-- Outils d'édition unitaire (Flottants) -->
        <div class="position-absolute top-0 end-0 mt-3 me-3">
          <button class="btn btn-light btn-sm border shadow-sm me-2" @click="printSingleDocument">
            <i class="bi bi-printer-fill me-1"></i> Imprimer
          </button>
        </div>

        <!-- Début du gabarit du document académique officiel -->
        <div class="document-print-area p-2 text-dark font-monospace" id="bulletin-template">
          <!-- Entête Institutionnelle -->
          <div class="row border-bottom pb-3 mb-4 text-uppercase text-center text-md-start">
            <div class="col-md-8">
              <h5 class="fw-bold mb-0">École Supérieure de Technologie et de Management</h5>
              <small class="text-muted text-xs"
                >République du Sénégal — Ministère de l'Enseignement Supérieur</small
              >
            </div>
            <div class="col-md-4 text-md-end mt-2 mt-md-0">
              <div class="fw-bold border p-2 text-center text-xs bg-light">RELEVÉ DE NOTES</div>
            </div>
          </div>

          <!-- Métadonnées Étudiant & Année -->
          <div class="row g-2 small mb-4 bg-light p-3 rounded">
            <div class="col-6">
              <div><strong>Nom & Prénom :</strong> {{ activeStudent.nom }}</div>
              <div><strong>Matricule :</strong> {{ activeStudent.matricule }}</div>
              <div><strong>Inscrit en :</strong> {{ selectedClasse }}</div>
            </div>
            <div class="col-6 text-end">
              <div><strong>Année Académique :</strong> 2025 / 2026</div>
              <div><strong>Période :</strong> Semestre 1</div>
              <div><strong>Session :</strong> Normale (Délibérée)</div>
            </div>
          </div>

          <!-- Structure des notes par UE -->
          <div class="table-responsive mb-4">
            <table class="table table-bordered table-sm align-middle text-xs text-center">
              <thead class="table-secondary">
                <tr>
                  <th class="text-start ps-2" style="width: 45%">
                    Unités d'Enseignement & Matières
                  </th>
                  <th style="width: 15%">Note /20</th>
                  <th style="width: 15%">Coeff.</th>
                  <th style="width: 15%">Crédits</th>
                  <th style="width: 10%">Résultat</th>
                </tr>
              </thead>
              <tbody>
                <!-- Bloc UE 1 -->
                <tr class="fw-bold table-light text-start">
                  <td colspan="5" class="ps-2 text-primary">
                    UE-INF-1 : Génie Logiciel & Outils de Dev
                  </td>
                </tr>
                <tr>
                  <td class="text-start ps-3 text-muted">Frameworks Modernes (Vue.js 3 & Node)</td>
                  <td>{{ activeStudent.n1 }}</td>
                  <td>2.0</td>
                  <td>4.0</td>
                  <td class="fw-bold">{{ activeStudent.n1 >= 10 ? 'V' : 'NV' }}</td>
                </tr>
                <tr>
                  <td class="text-start ps-3 text-muted">Conception orientée objet & Patterns</td>
                  <td>{{ activeStudent.n2 }}</td>
                  <td>2.0</td>
                  <td>4.0</td>
                  <td class="fw-bold">{{ activeStudent.n2 >= 10 ? 'V' : 'NV' }}</td>
                </tr>

                <!-- Bloc UE 2 -->
                <tr class="fw-bold table-light text-start">
                  <td colspan="5" class="ps-2 text-primary">
                    UE-DATA-2 : Data Science & Intelligence Artificielle
                  </td>
                </tr>
                <tr>
                  <td class="text-start ps-3 text-muted">Deep Learning & Vision par ordinateur</td>
                  <td>{{ activeStudent.n3 }}</td>
                  <td>3.0</td>
                  <td>6.0</td>
                  <td class="fw-bold">{{ activeStudent.n3 >= 10 ? 'V' : 'NV' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Synthèse Finale et Décision Statutaire -->
          <div class="row g-3 align-items-center small pt-2 border-top">
            <div class="col-7">
              <table class="table table-sm table-borderless mb-0 bg-light rounded text-xs">
                <tr>
                  <td class="fw-bold ps-2">Moyenne Générale Pondérée :</td>
                  <td class="fw-bold text-primary">{{ activeStudent.moyenne }} / 20</td>
                </tr>
                <tr>
                  <td class="fw-bold ps-2">Total Crédits Capitalisés :</td>
                  <td class="fw-bold text-success">
                    {{ activeStudent.statut === 'Admis' ? '14.0 / 14.0 ECTS' : 'En attente' }}
                  </td>
                </tr>
              </table>
            </div>
            <div class="col-5 text-end">
              <div class="small fw-bold mb-1 text-muted">DÉCISION DU JURY :</div>
              <span
                class="badge p-2 uppercase fw-bold border"
                :class="
                  activeStudent.statut === 'Admis'
                    ? 'border-success text-success bg-soft-success'
                    : 'border-danger text-danger bg-soft-danger'
                "
              >
                {{ activeStudent.statut === 'Admis' ? 'ADMIS(E)' : 'AJOURNÉ(E) / RATTRAPAGE' }}
              </span>
            </div>
          </div>

          <!-- Pied de page / Signatures -->
          <div class="row mt-5 pt-4 text-center text-xs text-muted">
            <div class="col-6">Fait à Dakar, le 19 Mai 2026</div>
            <div class="col-6 fw-bold text-dark text-decoration-underline">
              Le Directeur des Études et des Examens
            </div>
          </div>
        </div>
        <!-- Fin du gabarit -->
      </div>
    </div>

    <!-- Hors contexte de sélection -->
    <div class="col-12 py-5 text-center text-muted" v-else>
      <i class="bi bi-file-earmark-text display-4 text-light d-block mb-3"></i>
      <h6 class="fw-bold">Aucun dossier à l'écran</h6>
      <p class="small mb-0">
        Sélectionnez une promotion pédagogique pour charger et éditer les documents officiels.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// États
const selectedClasse = ref('');
const documentType = ref('Relevé de Notes');
const students = ref([]);
const activeStudent = ref(null);

const mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management']);

// Chargement de la promotion (Données issues de la délibération précédente)
const loadPromotion = () => {
  if (!selectedClasse.value) {
    students.value = [];
    activeStudent.value = null;
    return;
  }

  students.value = [
    {
      matricule: '2026-M101',
      nom: 'Ndiaye Fatou',
      n1: 14.5,
      n2: 12,
      n3: 15,
      moyenne: 14.07,
      statut: 'Admis',
    },
    {
      matricule: '2026-M102',
      nom: 'Camara Ibrahima',
      n1: 8.0,
      n2: 11,
      n3: 9.5,
      moyenne: 9.5,
      statut: 'Rattrapage',
    },
    {
      matricule: '2026-M103',
      nom: 'Sow Amadou',
      n1: 16.0,
      n2: 14.5,
      n3: 13.5,
      moyenne: 14.5,
      statut: 'Admis',
    },
    {
      matricule: '2026-M104',
      nom: 'Diallo Diariou',
      n1: 11.0,
      n2: 7.5,
      n3: 12,
      moyenne: 10.43,
      statut: 'Rattrapage',
    },
  ];

  // Sélection automatique du premier de la liste
  activeStudent.value = students.value[0];
};

const selectStudent = (student) => {
  activeStudent.value = student;
};

// Actions d'impression et d'exports
const printSingleDocument = () => {
  window.print();
};

const exportBulkPDF = () => {
  alert(
    `Génération du package ZIP contenant les ${students.value.length} bulletins de la promotion [${selectedClasse.value}] au format PDF standardisé.`
  );
};
</script>

<style scoped>
/* Couleurs softs Flat UI */
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.1);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}

.text-xs {
  font-size: 11px !important;
}

/* Feuille de style typographique stricte imitant un document officiel en format brut */
.document-print-area {
  background: #fff;
  line-height: 1.5;
  letter-spacing: -0.2px;
}

.table-bordered th,
.table-bordered td {
  border: 1px solid #dee2e6 !important;
}

/* Alignement avec la charte graphique rigoureuse de l'application ERP (Flat design) */
.rounded-4 {
  border-radius: 0.2rem !important;
}
.form-select,
.btn {
  font-size: 0.85rem;
}
.list-group-item {
  cursor: pointer;
  font-size: 0.85rem;
  border-bottom: 1px solid #f8f9fa !important;
}
.list-group-item:hover {
  background-color: #f8f9fa;
}
</style>
