<template>
  <div class="echeancier-container">
    <!-- Header de la section -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Plans d'Échelonnement & Échéanciers</h3>
        <p class="text-muted small mb-0">
          <i class="bi bi-calendar-range-fill text-primary me-1"></i>
          Configuration des traites, fractionnement des scolarités et suivi des échéances par
          classe.
        </p>
      </div>

      <!-- Action de création -->
      <button @click="openModalSetup" class="btn btn-sm btn-primary border-0 shadow-sm py-2 px-3">
        <i class="bi bi-plus-circle me-1"></i> Définir un nouveau Plan
      </button>
    </div>

    <!-- Section 1 : Configuration des Plans Types (Modèles d'échelonnement) -->
    <div class="row g-3 mb-4">
      <div v-for="plan in plansTypes" :key="plan.id" class="col-md-4">
        <div
          class="card border-0 shadow-sm rounded-4 bg-white p-3 border-top border-3"
          :class="'border-' + plan.color"
        >
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold text-dark mb-0">{{ plan.nom }}</h6>
            <span class="badge bg-light text-dark border font-monospace text-xs"
              >{{ plan.nombreTraites }} échéances</span
            >
          </div>
          <p class="text-muted text-xs mb-3">{{ plan.description }}</p>

          <!-- Traites détaillées -->
          <div class="timeline-traites small mb-3">
            <div
              v-for="(traite, idx) in plan.repartition"
              :key="idx"
              class="d-flex justify-content-between text-xs py-1 border-bottom border-light font-monospace"
            >
              <span class="text-secondary"
                ><i class="bi bi-arrow-right-short"></i> Traite {{ idx + 1 }} :</span
              >
              <span class="fw-bold text-dark"
                >{{ traite.pourcentage }}% ({{ traite.periode }})</span
              >
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center pt-2">
            <span class="text-xs text-muted"
              >Classes : <strong class="text-dark">{{ plan.classesAssociees }}</strong></span
            >
            <button
              class="btn btn-xs btn-light text-primary border-0 font-semibold py-1 px-2"
              style="font-size: 11px"
            >
              <i class="bi bi-pencil-square"></i> Gérer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2 : Registre de Suivi des Traites Étudiants -->
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
      <div
        class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center"
      >
        <h5 class="fw-bold text-dark mb-0">
          <i class="bi bi-person-lines-fill text-secondary me-2"></i>État des Échéances
          Individuelles (Mois en cours)
        </h5>
        <div class="d-flex gap-2">
          <select
            class="form-select form-select-sm text-xs shadow-none border"
            style="width: 150px"
          >
            <option>Toutes les filières</option>
            <option>Informatique</option>
            <option>Management</option>
          </select>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 text-center">
            <thead class="bg-light text-secondary small">
              <tr>
                <th class="ps-4 py-3 text-start">Étudiant & Plan</th>
                <th>Traite N°</th>
                <th>Montant Traite</th>
                <th>Date Échéance</th>
                <th>Statut Traite</th>
                <th>Retard</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="traite in suiviTraites" :key="traite.id">
                <!-- Étudiant -->
                <td class="ps-4 text-start">
                  <div class="fw-bold text-dark mb-0">{{ traite.etudiant }}</div>
                  <small class="text-muted font-monospace text-xs"
                    >{{ traite.matricule }} • {{ traite.plan }}</small
                  >
                </td>
                <!-- Numéro de la traite -->
                <td>
                  <span class="badge bg-light text-secondary border font-monospace"
                    >T{{ traite.numero }} / {{ traite.totalTraites }}</span
                  >
                </td>
                <!-- Montant -->
                <td class="font-monospace fw-bold">{{ formatPrice(traite.montant) }}</td>
                <!-- Échéance -->
                <td class="font-monospace text-muted small">
                  {{ formatDate(traite.dateEcheance) }}
                </td>
                <!-- Statut -->
                <td>
                  <span
                    class="badge px-2 py-1 rounded-pill fw-bold"
                    :class="getStatutClass(traite.statut)"
                  >
                    <i class="bi me-1" :class="getStatutIcon(traite.statut)"></i>
                    {{ traite.statut }}
                  </span>
                </td>
                <!-- Retard -->
                <td class="font-monospace text-xs fw-bold text-danger">
                  {{ traite.joursRetard > 0 ? '+' + traite.joursRetard + ' j' : '--' }}
                </td>
                <!-- Actions contextuelles -->
                <td class="text-end pe-4">
                  <div class="btn-group btn-group-xs">
                    <button
                      @click="encaisserTraite(traite)"
                      class="btn btn-sm btn-success border-0 py-1 px-2"
                      :disabled="traite.statut === 'Payée'"
                      title="Encaisser la traite"
                    >
                      <i class="bi bi-cash-coin"></i>
                    </button>
                    <button
                      @click="envoyerRappel(traite)"
                      class="btn btn-sm btn-light border py-1 px-2 text-danger"
                      :disabled="traite.statut === 'Payée'"
                      title="Relancer par SMS/Email"
                    >
                      <i class="bi bi-bell"></i>
                    </button>
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
import { ref } from 'vue';

// Modèles de structures d'échelons financiers applicables
const plansTypes = ref([
  {
    id: 1,
    nom: 'Plan Standard Classique',
    description: 'Structure de paiement de scolarité de base répartie sur le premier semestre.',
    nombreTraites: 3,
    classesAssociees: 'Licences (L1, L2, L3)',
    color: 'primary',
    repartition: [
      { pourcentage: 40, periode: "À l'inscription" },
      { pourcentage: 30, periode: 'Fin Novembre' },
      { pourcentage: 30, periode: 'Fin Janvier' },
    ],
  },
  {
    id: 2,
    nom: 'Plan Mensualisé Étendu',
    description: "Accords spécifiques pour aménagement social étalé sur l'année complète.",
    nombreTraites: 6,
    classesAssociees: 'Dérogations / Cas Sociaux',
    color: 'warning',
    repartition: [
      { pourcentage: 20, periode: "À l'inscription" },
      { pourcentage: 16, periode: 'Mensuel (Nov à Mar)' },
    ],
  },
  {
    id: 3,
    nom: 'Plan Executive Master',
    description: 'Frais de scolarité élevés scindés en deux gros acomptes de rentrée.',
    nombreTraites: 2,
    classesAssociees: 'Masters (M1, M2)',
    color: 'dark',
    repartition: [
      { pourcentage: 50, periode: "À l'inscription" },
      { pourcentage: 50, periode: 'Fin Décembre' },
    ],
  },
]);

// État des traites en temps réel
const suiviTraites = ref([
  {
    id: 101,
    matricule: 'ETU-2026-001',
    etudiant: 'Moussa Diallo',
    plan: 'Plan Standard',
    numero: 2,
    totalTraites: 3,
    montant: 150000,
    dateEcheance: '2026-05-15',
    statut: 'En retard',
    joursRetard: 4,
  },
  {
    id: 102,
    matricule: 'ETU-2026-002',
    etudiant: 'Awa Ndiaye',
    plan: 'Plan Standard',
    numero: 2,
    totalTraites: 3,
    montant: 150000,
    dateEcheance: '2026-05-15',
    statut: 'Payée',
    joursRetard: 0,
  },
  {
    id: 103,
    matricule: 'ETU-2026-114',
    etudiant: 'Ibrahima Diallo',
    plan: 'Plan Executive',
    numero: 2,
    totalTraites: 2,
    montant: 300000,
    dateEcheance: '2026-04-30',
    statut: 'Contentieux',
    joursRetard: 19,
  },
  {
    id: 104,
    matricule: 'ETU-2026-204',
    etudiant: 'Oumar Sy',
    plan: 'Plan Mensuel',
    numero: 4,
    totalTraites: 6,
    montant: 75000,
    dateEcheance: '2026-05-25',
    statut: 'En attente',
    joursRetard: 0,
  },
]);

const formatPrice = (val) => {
  return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Classes et icônes d'alerte pour les badges de l'échéancier
const getStatutClass = (statut) => {
  if (statut === 'Payée') return 'bg-soft-success text-success';
  if (statut === 'En attente') return 'bg-soft-primary text-primary';
  if (statut === 'En retard') return 'bg-soft-warning text-warning';
  if (statut === 'Contentieux') return 'bg-soft-danger text-danger';
  return 'bg-light text-dark';
};

const getStatutIcon = (statut) => {
  if (statut === 'Payée') return 'bi-check-circle-fill';
  if (statut === 'En attente') return 'bi-clock-history';
  if (statut === 'En retard') return 'bi-exclamation-triangle-fill';
  if (statut === 'Contentieux') return 'bi-shield-slash-fill';
  return 'bi-circle';
};

// Actions rapides
const openModalSetup = () => {
  alert("Ouverture du panneau de configuration des matrices d'échelonnement académique.");
};

const encaisserTraite = (traite) => {
  traite.statut = 'Payée';
  traite.joursRetard = 0;
  alert(
    `Traite enregistrée avec succès pour ${traite.etudiant}. Le grand livre comptable a été mis à jour.`
  );
};

const envoyerRappel = (traite) => {
  alert(
    `Relance automatique envoyée à ${traite.etudiant} (${traite.matricule}).\nCanal utilisé : SMS & Notification Portail.`
  );
};
</script>

<style scoped>
/* Classes Soft UI ERP standard */
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.08);
}
.bg-soft-primary {
  background-color: rgba(0, 123, 255, 0.08);
}

.text-xs {
  font-size: 11px !important;
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
}

/* Ligne graphique stricte de l'ERP */
.rounded-4 {
  border-radius: 0.2rem !important;
}
</style>
