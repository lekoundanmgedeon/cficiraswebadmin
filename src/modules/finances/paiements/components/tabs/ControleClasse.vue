<template>
  <div class="controle-classe-container">
    <!-- En-tête -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h3 class="fw-bold mb-1">Contrôle des paiements par classe</h3>
        <p class="text-muted small mb-0">
          <i class="bi bi-people me-1"></i>
          Sélectionnez une classe pour voir, en un coup d'œil, qui est à jour et qui accuse du
          retard sur l'année.
        </p>
      </div>

      <div v-if="lignes.length > 0" class="btn-group shadow-sm">
        <button class="btn btn-sm btn-white border" @click="exportData('csv')">
          <i class="bi bi-filetype-csv text-secondary me-1"></i> CSV
        </button>
        <button class="btn btn-sm btn-white border mx-1" @click="exportData('excel')">
          <i class="bi bi-file-earmark-spreadsheet text-success me-1"></i> Excel
        </button>
        <button class="btn btn-sm btn-white border" @click="exportData('pdf')">
          <i class="bi bi-file-earmark-pdf text-danger me-1"></i> PDF
        </button>
      </div>
    </div>

    <!-- Sélecteur de classe -->
    <div class="card mb-4 border-0 shadow-sm bg-light rounded-4">
      <div class="card-body p-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-6">
            <select v-model="classeId" class="form-select border-0 shadow-sm" @change="charger">
              <option value="">Choisir une classe…</option>
              <option v-for="cl in classes" :key="cl.id" :value="cl.id">
                {{ cl.code }}{{ cl.filiere ? ` — ${cl.filiere}` : '' }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <select v-model="filtreStatut" class="form-select border-0 shadow-sm">
              <option value="">Tous les statuts</option>
              <option value="PAYE">À jour</option>
              <option value="PARTIEL">Partiel</option>
              <option value="EN_RETARD">En retard</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Cartes de synthèse -->
    <div v-if="classeId && lignes.length > 0" class="row g-3 mb-4">
      <div class="col-md-3 col-6">
        <div class="card border-0 shadow-sm rounded-4 text-center py-3">
          <div class="fs-4 fw-bold">{{ lignes.length }}</div>
          <div class="small text-muted">Étudiants</div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="card border-0 shadow-sm rounded-4 text-center py-3">
          <div class="fs-4 fw-bold text-success">{{ compteur.PAYE }}</div>
          <div class="small text-muted">À jour</div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="card border-0 shadow-sm rounded-4 text-center py-3">
          <div class="fs-4 fw-bold text-danger">{{ compteur.EN_RETARD }}</div>
          <div class="small text-muted">En retard</div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="card border-0 shadow-sm rounded-4 text-center py-3">
          <div class="fs-4 fw-bold text-danger">{{ formatMoney(totalReste) }}</div>
          <div class="small text-muted">Reste à recouvrer</div>
        </div>
      </div>
    </div>

    <!-- États -->
    <div v-if="loading" class="text-center py-5 text-muted">
      <i class="bi bi-hourglass-split display-6 d-block mb-2"></i>
      Chargement…
    </div>

    <div v-else-if="!classeId" class="text-center py-5 text-muted">
      <i class="bi bi-hand-index-thumb display-4 text-light d-block mb-2"></i>
      <p class="small mb-0">Choisissez une classe pour afficher le contrôle.</p>
    </div>

    <div v-else-if="lignes.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-folder-x display-4 text-light d-block mb-2"></i>
      <p class="small mb-0">Aucun échéancier généré pour cette classe.</p>
    </div>

    <!-- Tableau -->
    <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-secondary small">
              <tr>
                <th class="ps-4 py-3" style="width: 70px">#</th>
                <th>Matricule</th>
                <th>Nom & Prénom</th>
                <th class="text-end">Dû</th>
                <th class="text-end">Réglé</th>
                <th class="text-end">Reste</th>
                <th class="text-center pe-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ligne, index) in paginated" :key="ligne.etudiant_id">
                <td class="ps-4 text-muted small">{{ startIndex + index + 1 }}</td>
                <td class="font-monospace fw-bold text-primary">{{ ligne.matricule }}</td>
                <td class="fw-semibold">{{ ligne.etudiant }}</td>
                <td class="text-end">{{ formatMoney(ligne.du) }}</td>
                <td class="text-end text-success">{{ formatMoney(ligne.regle) }}</td>
                <td class="text-end" :class="ligne.reste > 0 ? 'text-danger' : ''">
                  {{ formatMoney(ligne.reste) }}
                </td>
                <td class="text-center pe-4">
                  <span
                    class="badge px-2 py-1 rounded-pill fw-bold"
                    :class="`bg-soft-${ligne.variant} text-${ligne.variant}`"
                  >
                    {{ ligne.statutLabel }}
                  </span>
                </td>
              </tr>

              <tr v-if="lignesFiltrees.length === 0">
                <td colspan="7" class="text-center py-4 text-muted small">
                  Aucun étudiant ne correspond à ce statut.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="lignesFiltrees.length" class="card-footer bg-white border-0 py-3 px-4">
        <Pagination
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="lignesFiltrees.length"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Pagination from '@/components/shared/Pagination.vue';
import { useClasseStore } from '@/modules/structure-academique/classe/store';
import { useEcheancierStore } from '@/modules/finances/stores/echeanciers';
import { useTableExport } from '@/shared/composables/useTableExport';
import { usePagination } from '@/shared/composables/usePagination';
import { formatMoney, statutInfo, STATUTS_ECHEANCE } from '@/modules/finances/constants';

/**
 * Contrôle collectif : le statut de paiement de tous les étudiants d'une classe.
 *
 * `GET /echeanciers/suivi?classe_id=` renvoie une ligne **par échéance** ; on les
 * regroupe ici par étudiant pour un statut d'ensemble. Une limite serveur
 * généreuse (`limite`) est passée car une classe de 30 étudiants sur un plan
 * mensuel produit ~360 échéances — au-delà du défaut de 500 pour deux classes.
 *
 * Le statut d'ensemble suit la hiérarchie des échéances : le retard prime.
 */

const classeStore = useClasseStore();
const echeancierStore = useEcheancierStore();

const classeId = ref('');
const filtreStatut = ref('');

const classes = computed(() => classeStore.items ?? []);
const loading = computed(() => echeancierStore.loading);

onMounted(() => classeStore.fetchAll());

async function charger() {
  if (!classeId.value) return;
  // Limite haute : le regroupement se fait côté client, il faut toutes les
  // échéances de la classe, pas les 500 plus en retard.
  await echeancierStore.fetchSuivi({ classe_id: classeId.value, limite: 5000 });
}

/**
 * Regroupe les échéances par étudiant.
 * @returns {Array<{etudiant_id: string, matricule: string, etudiant: string,
 *   du: number, regle: number, reste: number, statut: string, statutLabel: string,
 *   variant: string, enRetard: boolean}>}
 */
const lignes = computed(() => {
  const parEtudiant = new Map();

  for (const t of echeancierStore.traites) {
    const cle = t.etudiant_id;
    if (!parEtudiant.has(cle)) {
      parEtudiant.set(cle, {
        etudiant_id: cle,
        matricule: t.matricule,
        etudiant: t.etudiant ?? `${t.nom ?? ''} ${t.prenom ?? ''}`.trim(),
        du: 0,
        regle: 0,
        reste: 0,
        enRetard: false,
      });
    }
    const ligne = parEtudiant.get(cle);
    ligne.du += Number(t.montant ?? 0);
    ligne.regle += Number(t.montant_regle ?? 0);
    ligne.reste += Number(t.reste ?? 0);
    if (t.statut === 'EN_RETARD') ligne.enRetard = true;
  }

  return [...parEtudiant.values()]
    .map((ligne) => {
      let statut = 'EN_ATTENTE';
      if (ligne.du > 0 && ligne.reste <= 0) statut = 'PAYE';
      else if (ligne.enRetard) statut = 'EN_RETARD';
      else if (ligne.regle > 0) statut = 'PARTIEL';

      const info = statutInfo(STATUTS_ECHEANCE, statut);
      return { ...ligne, statut, statutLabel: info.label, variant: info.variant };
    })
    .sort((a, b) => b.reste - a.reste);
});

const lignesFiltrees = computed(() =>
  filtreStatut.value ? lignes.value.filter((l) => l.statut === filtreStatut.value) : lignes.value
);

// La page revient à 1 quand on change de classe ou de statut : la liste
// affichée n'est plus la même.
const { page, itemsPerPage, startIndex, paginated } = usePagination(lignesFiltrees, {
  perPage: 15,
  resetKey: () => [classeId.value, filtreStatut.value],
});

const compteur = computed(() => {
  const base = { PAYE: 0, PARTIEL: 0, EN_RETARD: 0, EN_ATTENTE: 0 };
  for (const ligne of lignes.value) base[ligne.statut] = (base[ligne.statut] ?? 0) + 1;
  return base;
});

const totalReste = computed(() => lignes.value.reduce((total, l) => total + l.reste, 0));

const exportRows = computed(() =>
  lignesFiltrees.value.map((ligne) => ({
    Matricule: ligne.matricule,
    'Nom & Prénom': ligne.etudiant,
    Dû: Math.round(ligne.du),
    Réglé: Math.round(ligne.regle),
    Reste: Math.round(ligne.reste),
    Statut: ligne.statutLabel,
  }))
);

const { exportToExcel, exportToPdf, exportToCsv } = useTableExport({
  rows: exportRows,
  title: 'Contrôle des paiements par classe',
  fileBaseName: 'controle-paiements-classe',
});

/** @param {'csv'|'excel'|'pdf'} format */
const exportData = (format) => {
  if (format === 'csv') return exportToCsv();
  if (format === 'excel') return exportToExcel();
  return exportToPdf();
};
</script>

<style scoped>
.bg-soft-success {
  background-color: rgba(40, 167, 69, 0.12);
}
.bg-soft-warning {
  background-color: rgba(255, 193, 7, 0.15);
}
.bg-soft-danger {
  background-color: rgba(220, 53, 69, 0.12);
}
.bg-soft-secondary {
  background-color: rgba(108, 117, 125, 0.12);
}

.table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  border: none;
}

.btn-white {
  background-color: #ffffff;
}

.rounded-4 {
  border-radius: 0.5rem !important;
}
</style>
