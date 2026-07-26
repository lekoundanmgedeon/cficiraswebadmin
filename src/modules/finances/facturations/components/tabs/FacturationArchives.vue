<template>
  <div class="transactions-container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold text-secondary">Gestion des Flux Financiers</h4>
        <p class="text-muted small">
          Enregistrement et suivi des entrées (revenus) et sorties (dépenses).
        </p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary btn-sm" @click="exportReport">
          <i class="mdi mdi-file-export me-1"></i> Exporter Rapport Mensuel
        </button>
        <button
          class="btn btn-secondary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#transactionModal"
        >
          + Nouvelle Transaction
        </button>
      </div>
    </div>

    <div class="row mb-4 g-3">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm bg-light">
          <div class="card-body">
            <h6 class="text-uppercase small fw-bold text-success">Total Entrées (Revenus)</h6>
            <h3 class="mb-0 fw-bold">+ {{ formatPrice(totalEntrees) }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm bg-light">
          <div class="card-body">
            <h6 class="text-uppercase small fw-bold text-danger">Total Sorties (Dépenses)</h6>
            <h3 class="mb-0 fw-bold">- {{ formatPrice(totalSorties) }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm bg-dark text-white">
          <div class="card-body">
            <h6 class="text-uppercase small fw-bold opacity-75">Solde Net (Bénéfice)</h6>
            <h3 class="mb-0 fw-bold">{{ formatPrice(totalEntrees - totalSorties) }}</h3>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4 shadow-sm border-0">
      <div class="card-header bg-white py-3 border-0">
        <div class="row align-items-center">
          <div class="col-md-4">
            <h6 class="mb-0 fw-bold">Historique des Transactions</h6>
          </div>
          <div class="col-md-8 d-flex gap-2">
            <select v-model="filterCategory" class="form-select form-select-sm border-0 bg-light">
              <option value="Toutes">Toutes les catégories</option>
              <option value="Revenus">Revenus Étudiants</option>
              <option value="Salaires">Salaires / Honoraires</option>
              <option value="Opérationnel">Dépenses Opérationnelles</option>
              <option value="Maintenance">Entretien & Fournitures</option>
            </select>
            <input
              type="month"
              v-model="filterMonth"
              class="form-control form-control-sm border-0 bg-light w-auto"
            />
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light small fw-bold">
              <tr>
                <th class="ps-4">Date</th>
                <th>Libellé / Motif</th>
                <th>Catégorie</th>
                <th>Type</th>
                <th>Montant</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTransactions" :key="t.id">
                <td class="ps-4">{{ t.date }}</td>
                <td>
                  <div class="fw-bold">{{ t.libelle }}</div>
                  <small class="text-muted">{{ t.reference }}</small>
                </td>
                <td>
                  <span class="badge bg-outline-dark text-dark border">{{ t.categorie }}</span>
                </td>
                <td>
                  <i
                    :class="
                      t.type === 'Entrée'
                        ? 'mdi mdi-arrow-up-bold text-success'
                        : 'mdi mdi-arrow-down-bold text-danger'
                    "
                  ></i>
                  <small class="ms-1 fw-bold">{{ t.type }}</small>
                </td>
                <td :class="t.type === 'Entrée' ? 'text-success fw-bold' : 'text-danger fw-bold'">
                  {{ t.type === 'Entrée' ? '+' : '-' }} {{ formatPrice(t.montant) }}
                </td>
                <td class="text-center">
                  <button class="btn btn-link btn-sm text-dark p-0">
                    <i class="mdi mdi-pencil"></i>
                  </button>
                  <button class="btn btn-link btn-sm text-danger p-0 ms-2">
                    <i class="mdi mdi-trash-can-outline"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal fade" id="transactionModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content border-0">
          <div class="modal-header bg-secondary text-white">
            <h5 class="modal-title">Enregistrer une opération</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTransaction">
              <div class="mb-3">
                <label class="form-label fw-bold">Type d'opération</label>
                <div class="d-flex gap-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      v-model="newT.type"
                      value="Entrée"
                      id="t-in"
                    />
                    <label class="form-check-label text-success fw-bold" for="t-in"
                      >Entrée (Revenu)</label
                    >
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      v-model="newT.type"
                      value="Sortie"
                      id="t-out"
                    />
                    <label class="form-check-label text-danger fw-bold" for="t-out"
                      >Sortie (Dépense)</label
                    >
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Catégorie</label>
                  <select v-model="newT.categorie" class="form-select" required>
                    <option value="Administratives">Administratives</option>
                    <option value="Opérationnelles">Opérationnelles</option>
                    <option value="Salaires">Salaires</option>
                    <option value="Entretien">Entretien / Fournitures</option>
                    <option value="Revenus">Scolarité / Inscription</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Date</label>
                  <input type="date" v-model="newT.date" class="form-control" required />
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Libellé / Désignation</label>
                <input
                  type="text"
                  v-model="newT.libelle"
                  class="form-control"
                  placeholder="Ex: Achat cartouches encre"
                  required
                />
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Montant (FCFA)</label>
                <input
                  type="number"
                  v-model="newT.montant"
                  class="form-control"
                  placeholder="0"
                  required
                />
              </div>
              <button type="submit" class="btn btn-dark w-100 mt-2">
                Enregistrer la transaction
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const filterCategory = ref('Toutes');
const filterMonth = ref(new Date().toISOString().slice(0, 7));

const newT = ref({
  type: 'Sortie',
  categorie: 'Administratives',
  date: new Date().toISOString().split('T')[0],
  libelle: '',
  montant: null,
});

const transactions = ref([
  {
    id: 1,
    date: '2023-11-01',
    libelle: 'Scolarité Licence 1 - Groupe A',
    reference: 'REV-001',
    categorie: 'Revenus',
    type: 'Entrée',
    montant: 1250000,
  },
  {
    id: 2,
    date: '2023-11-02',
    libelle: 'Salaires Formateurs Octobre',
    reference: 'EXP-045',
    categorie: 'Salaires',
    type: 'Sortie',
    montant: 850000,
  },
  {
    id: 3,
    date: '2023-11-03',
    libelle: 'Facture Électricité SENELEC',
    reference: 'EXP-046',
    categorie: 'Opérationnel',
    type: 'Sortie',
    montant: 45000,
  },
  {
    id: 4,
    date: '2023-11-05',
    libelle: 'Achat Fournitures de bureau',
    reference: 'EXP-047',
    categorie: 'Maintenance',
    type: 'Sortie',
    montant: 25000,
  },
]);

const filteredTransactions = computed(() => {
  return transactions.value.filter((t) => {
    return filterCategory.value === 'Toutes' || t.categorie.includes(filterCategory.value);
  });
});

const totalEntrees = computed(() =>
  transactions.value.filter((t) => t.type === 'Entrée').reduce((a, b) => a + b.montant, 0)
);
const totalSorties = computed(() =>
  transactions.value.filter((t) => t.type === 'Sortie').reduce((a, b) => a + b.montant, 0)
);

const formatPrice = (v) => new Intl.NumberFormat('fr-FR').format(v) + ' F';

const saveTransaction = () => {
  transactions.value.unshift({
    ...newT.value,
    id: Date.now(),
    reference: 'TRX-' + Math.floor(Math.random() * 1000),
  });
  alert('Transaction enregistrée !');
  // Logique de fermeture modal ici
};

const exportReport = () => alert(`Génération du rapport financier de ${filterMonth.value}...`);
</script>

<style scoped></style>
