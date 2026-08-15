<template>
  <div class="facturation-container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold">Gestion de la Facturation</h4>
        <p class="text-muted small">
          Suivi des soldes, émission de factures et rappels de paiement.
        </p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary btn-sm" @click="triggerAutoGeneration">
          <i class="mdi mdi-autorenew me-1"></i> Génération Automatique
        </button>
        <button class="btn btn-secondary btn-sm" @click="openNewFactureModal">
          + Nouvelle Facture
        </button>
      </div>
    </div>

    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card bg-light border-0">
          <div class="card-body p-3">
            <p class="text-muted small mb-1">Total Facturé</p>
            <h5 class="fw-bold mb-0">{{ formatPrice(totaux.facture) }}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-soft-warning border-0">
          <div class="card-body p-3">
            <p class="text-warning small mb-1">En attente (Impayés)</p>
            <h5 class="fw-bold mb-0 text-warning">{{ formatPrice(totaux.solde) }}</h5>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body bg-light rounded p-3">
        <div class="row g-2">
          <div class="col-md-6">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Rechercher un étudiant ou N° facture..."
            />
          </div>
          <div class="col-md-3">
            <select v-model="statusFilter" class="form-select">
              <option value="tous">Tous les statuts</option>
              <option value="payé">Payées</option>
              <option value="partiel">Partielles</option>
              <option value="impayé">Impayées</option>
            </select>
          </div>
          <div class="col-md-3 text-end">
            <button class="btn btn-dark w-100" @click="sendBulkReminders">
              <i class="mdi mdi-email-alert me-1"></i> Rappels groupés
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="bg-white text-uppercase small fw-bold">
              <tr>
                <th class="ps-4" style="width: 70px">#</th>
                <th>N° Facture</th>
                <th>Étudiant</th>
                <th>Total Dû</th>
                <th>Déjà Payé</th>
                <th>Solde Restant</th>
                <th>Statut</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(facture, index) in paginated" :key="facture.id" class="align-middle">
                <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>
                <td class="fw-bold text-primary">#{{ facture.numero }}</td>
                <td>
                  <div class="fw-bold">{{ facture.etudiant }}</div>
                  <div class="text-muted extra-small">{{ facture.matricule }}</div>
                </td>
                <td>{{ formatPrice(facture.totalDu) }}</td>
                <td class="text-success">{{ formatPrice(facture.dejaPaye) }}</td>
                <td :class="facture.solde > 0 ? 'text-danger fw-bold' : 'text-muted'">
                  {{ formatPrice(facture.solde) }}
                </td>
                <td>
                  <span :class="getStatusBadge(facture.statut)">{{ facture.statut }}</span>
                </td>
                <td class="text-center">
                  <div class="btn-group">
                    <button
                      class="btn btn-sm btn-outline-secondary"
                      @click="downloadPDF(facture)"
                      title="Télécharger PDF"
                    >
                      <i class="mdi mdi-download"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-info"
                      @click="sendEmail(facture)"
                      title="Envoyer par Email"
                    >
                      <i class="mdi mdi-send"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-primary"
                      @click="viewDetails(facture)"
                      title="Détails"
                    >
                      <i class="mdi mdi-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredFactures.length === 0">
                <td colspan="8" class="text-center py-5">
                  <img src="/img/empty-box.svg" alt="Vide" width="60" class="mb-2 opacity-50" />
                  <p class="text-muted">Aucune facture trouvée.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="filteredFactures.length" class="card-footer bg-white border-0 py-3 px-4">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="filteredFactures.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { usePagination } from '@/shared/composables/usePagination';
import { useAnneeStore } from '@/modules/structure-academique/annee/store';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useFactureStore } from '@/modules/finances/stores/factures';
import { facturesResource } from '@/modules/finances/api';
import { ouvrirFacture } from '@/modules/finances/utils/recu';

/**
 * Registre des factures.
 *
 * Les trois factures affichées étaient codées en dur, et les quatre actions
 * (« PDF », « Email », « Détails », « Rappels groupés ») n'étaient que des
 * `alert()`. Les deux compteurs du haut — « 12.450.000 F » facturés,
 * « 3.200.000 F » impayés — étaient des constantes écrites dans le balisage.
 *
 * Tout vient maintenant de `GET /finance/factures`. La vue serveur
 * (`v_finance_factures`) ne stocke aucun solde : elle le **déduit** des
 * paiements confirmés. Un encaissement fait donc bouger le solde et le statut
 * d'une facture sans que rien n'ait à être recalculé ici.
 *
 * Les colonnes du serveur sont en `snake_case` (`total_du`, `deja_paye`) ; le
 * tableau, lui, lit `totalDu` et `dejaPaye`. La correspondance est faite dans
 * `factures`, ce qui laisse le balisage inchangé.
 */

const store = useFactureStore();
const anneeStore = useAnneeStore();
const classeStore = useClasseStore();
const notifications = useNotificationStore();

const searchQuery = ref('');
const statusFilter = ref('tous');

onMounted(() => {
  // ⚠️ `GET /finance/factures` plafonne à 200 lignes sans `limite`
  // (`facture.model.js`) : le registre en affichait donc 200 sur 1 803, sans le
  // dire, et ses compteurs de tête portaient sur cet échantillon. Le registre
  // complet pèse 1,2 Mo — assez léger pour être chargé d'un coup, contrairement
  // aux 8 Mo des encaissements.
  store.fetchAll({ params: { limite: 100000 } });
  anneeStore.fetchAll();
  classeStore.fetchAll();
});

const factures = computed(() =>
  store.items.map((facture) => ({
    ...facture,
    totalDu: Number(facture.total_du ?? 0),
    dejaPaye: Number(facture.deja_paye ?? 0),
    solde: Number(facture.solde ?? 0),
  }))
);

/** Ce que les deux compteurs du haut affichaient en dur. */
const totaux = computed(() => store.totaux);

const filteredFactures = computed(() =>
  factures.value.filter((f) => {
    const recherche = searchQuery.value.toLowerCase();
    const matchesSearch =
      !recherche ||
      String(f.etudiant ?? '')
        .toLowerCase()
        .includes(recherche) ||
      String(f.matricule ?? '')
        .toLowerCase()
        .includes(recherche) ||
      String(f.numero ?? '')
        .toLowerCase()
        .includes(recherche);

    const matchesStatus =
      statusFilter.value === 'tous' ||
      String(f.statut ?? '').toLowerCase() === statusFilter.value.toLowerCase();

    return matchesSearch && matchesStatus;
  })
);

/**
 * Le registre porte **1 803 factures** sur le jeu de démonstration, rendues
 * d'un bloc. Une recherche ou un changement de statut ramène en première page.
 */
const { page, itemsPerPage, startIndex, paginated } = usePagination(filteredFactures, {
  perPage: 15,
  resetKey: () => [searchQuery.value, statusFilter.value],
});

const formatPrice = (val) => new Intl.NumberFormat('fr-FR').format(Number(val ?? 0)) + ' F';

const getStatusBadge = (status) => {
  const base = 'badge rounded-pill ';
  if (status === 'Payé') return base + 'bg-success';
  if (status === 'Partiel') return base + 'bg-warning text-dark';
  if (status === 'Annulée') return base + 'bg-secondary';
  return base + 'bg-danger';
};

/**
 * Ouvre le document de la facture : ses lignes et les règlements imputés.
 *
 * Le serveur n'expose pas de PDF — `GET /factures/:id` rend les données, pas le
 * document. Il est composé côté client, et l'impression du navigateur permet de
 * l'enregistrer en PDF.
 *
 * @param {any} facture @param {boolean} imprimer
 */
async function ouvrirDocument(facture, imprimer) {
  const reponse = await store.run(() => facturesResource.getById(facture.id), {
    failure: 'Erreur lors de la récupération de la facture.',
  });
  if (!reponse) return;

  try {
    ouvrirFacture(reponse.data, { imprimer });
  } catch (error) {
    notifications.notifyError(error, 'Impossible d’ouvrir la facture.');
  }
}

const downloadPDF = (f) => ouvrirDocument(f, true);
const viewDetails = (f) => ouvrirDocument(f, false);

/**
 * L'envoi d'e-mails n'a pas d'endpoint : aucune route du backend n'expédie de
 * courrier (voir `routes/finances/facture.routes.js`). Le dire vaut mieux que de
 * laisser croire à un envoi, comme le faisait l'`alert()` précédente.
 */
const sendEmail = (f) =>
  notifications.notifyWarning(
    `L’envoi par e-mail n’est pas encore disponible. Adresse du dossier : ${f.email ?? 'non renseignée'}.`
  );

const sendBulkReminders = async () => {
  await store.fetchImpayees();
  notifications.notifyWarning(
    `${store.impayees.length} facture(s) non soldée(s), pour ${formatPrice(store.totalImpaye)}. ` +
      'L’envoi des rappels par e-mail n’est pas encore disponible côté serveur.'
  );
};

/**
 * Facture toutes les inscriptions non encore facturées de l'année active.
 *
 * Le serveur facture une classe à la fois ; l'écran ne demandant pas de classe,
 * on les parcourt toutes. Les inscriptions déjà facturées sont ignorées par le
 * serveur : relancer la génération est sans effet, et non une erreur.
 */
const triggerAutoGeneration = async () => {
  const annee = anneeStore.activeAnnee;

  if (!annee) {
    notifications.notifyWarning(
      'Aucune année académique active : impossible de savoir sur quel exercice facturer.'
    );
    return;
  }

  await store.genererPourClasses(classeStore.items, annee.id);
};
</script>

<style scoped>
.bg-soft-warning {
  background-color: #fff4e5;
}
.extra-small {
  font-size: 0.75rem;
}
.table thead th {
  border: none;
  font-size: 0.7rem;
  color: #888;
}
.badge {
  font-weight: 500;
  font-size: 0.75rem;
}
.btn-group .btn {
  padding: 0.25rem 0.5rem;
}
</style>
