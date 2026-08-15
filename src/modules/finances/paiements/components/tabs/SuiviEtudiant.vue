<template>
  <div class="suivi-etudiant-container">
    <!-- En-tête -->
    <div class="mb-4">
      <h3 class="fw-bold mb-1">Suivi des paiements par étudiant</h3>
      <p class="text-muted small mb-0">
        <i class="bi bi-search me-1"></i>
        Recherchez un étudiant pour voir, période par période, s'il a réglé le mois, le semestre ou
        l'année — et éditez son code QR de contrôle.
      </p>
    </div>

    <!-- Recherche d'un étudiant -->
    <div class="card mb-4 border-0 shadow-sm bg-light rounded-4">
      <div class="card-body p-3">
        <div class="position-relative">
          <input
            v-model="recherche"
            type="text"
            class="form-control border-0 shadow-sm"
            placeholder="Matricule, nom ou prénom de l'étudiant…"
            @input="onRecherche"
          />

          <!-- Résultats de recherche -->
          <ul
            v-if="resultats.length > 0 && !etudiantSelectionne"
            class="list-group position-absolute w-100 shadow-sm mt-1 resultats"
          >
            <li
              v-for="etu in resultats"
              :key="etu.id"
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              role="button"
              @click="selectionner(etu)"
            >
              <span>
                <span class="font-monospace fw-bold text-primary me-2">{{ etu.matricule }}</span>
                {{ etu.nom }} {{ etu.prenom }}
              </span>
              <small class="text-muted">{{ etu.filiere_nom ?? '—' }}</small>
            </li>
          </ul>
        </div>

        <div v-if="rechercheEnCours" class="small text-muted mt-2">
          <i class="bi bi-hourglass-split me-1"></i> Recherche en cours…
        </div>
        <div
          v-else-if="recherche.length >= 2 && resultats.length === 0 && !etudiantSelectionne"
          class="small text-muted mt-2"
        >
          Aucun étudiant ne correspond à « {{ recherche }} ».
        </div>
      </div>
    </div>

    <!-- Fiche de l'étudiant sélectionné -->
    <div v-if="etudiantSelectionne">
      <!-- Bandeau identité -->
      <div class="card border-0 shadow-sm rounded-4 mb-4">
        <div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h4 class="fw-bold mb-1">
              {{ etudiantSelectionne.nom }} {{ etudiantSelectionne.prenom }}
            </h4>
            <p class="text-muted small mb-0">
              <span class="font-monospace fw-bold text-primary me-2">{{
                etudiantSelectionne.matricule
              }}</span>
              <span v-if="classeLibelle" class="me-2">
                <i class="bi bi-mortarboard me-1"></i>{{ classeLibelle }}
              </span>
              <span v-if="periodiciteLibelle" class="badge bg-light text-dark border">
                Plan {{ periodiciteLibelle }}
              </span>
            </p>
          </div>
          <div class="d-flex gap-2">
            <button
              class="btn btn-sm btn-white border shadow-sm"
              :disabled="echeances.length === 0"
              @click="imprimer"
            >
              <i class="bi bi-printer me-1"></i> Imprimer la fiche
            </button>
            <button class="btn btn-sm btn-white border shadow-sm" @click="reinitialiser">
              <i class="bi bi-x-lg me-1"></i> Fermer
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5 text-muted">
        <i class="bi bi-hourglass-split display-6 d-block mb-2"></i>
        Chargement de l'échéancier…
      </div>

      <div v-else-if="echeances.length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-folder-x display-4 text-light d-block mb-2"></i>
        <p class="small mb-0">Aucun échéancier n'a encore été généré pour cet étudiant.</p>
      </div>

      <div v-else class="row g-4">
        <!-- Synthèse + QR -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body">
              <h6 class="text-uppercase text-muted small fw-bold mb-3">Synthèse</h6>

              <dl class="row small mb-3">
                <dt class="col-6 text-muted fw-normal">Total dû</dt>
                <dd class="col-6 text-end fw-bold">{{ formatMoney(synthese.du) }}</dd>
                <dt class="col-6 text-muted fw-normal">Déjà réglé</dt>
                <dd class="col-6 text-end fw-bold text-success">
                  {{ formatMoney(synthese.regle) }}
                </dd>
                <dt class="col-6 text-muted fw-normal">Reste à payer</dt>
                <dd class="col-6 text-end fw-bold" :class="synthese.reste > 0 ? 'text-danger' : ''">
                  {{ formatMoney(synthese.reste) }}
                </dd>
                <dt class="col-6 text-muted fw-normal">Taux de règlement</dt>
                <dd class="col-6 text-end fw-bold">{{ synthese.taux }} %</dd>
              </dl>

              <div class="text-center mb-3">
                <span
                  class="badge px-3 py-2 rounded-pill fw-bold"
                  :class="`bg-soft-${synthese.variant} text-${synthese.variant}`"
                >
                  {{ synthese.statutLabel }}
                </span>
              </div>

              <!-- QR de contrôle -->
              <div class="text-center border-top pt-3">
                <img
                  v-if="qrDataUrl"
                  :src="qrDataUrl"
                  alt="Code QR de contrôle de la situation de paiement"
                  class="qr-image"
                />
                <p class="small text-muted mt-2 mb-0">
                  Code de contrôle — scannez pour vérifier la situation de paiement (matricule,
                  montants, statut).
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Détail période par période -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light text-secondary small">
                    <tr>
                      <th class="ps-4 py-3">Période</th>
                      <th>Échéance</th>
                      <th class="text-end">Dû</th>
                      <th class="text-end">Réglé</th>
                      <th class="text-end">Reste</th>
                      <th class="text-center pe-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ech in echeances" :key="ech.id">
                      <td class="ps-4 fw-semibold">{{ ech.libelle }}</td>
                      <td class="small text-muted">{{ ech.date_echeance_fr }}</td>
                      <td class="text-end">{{ formatMoney(ech.montant) }}</td>
                      <td class="text-end text-success">{{ formatMoney(ech.montant_regle) }}</td>
                      <td class="text-end" :class="Number(ech.reste) > 0 ? 'text-danger' : ''">
                        {{ formatMoney(ech.reste) }}
                      </td>
                      <td class="text-center pe-4">
                        <span
                          class="badge px-2 py-1 rounded-pill fw-bold"
                          :class="`bg-soft-${statutVariant(ech.statut)} text-${statutVariant(ech.statut)}`"
                        >
                          {{ statutLabel(ech.statut) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useEtudiantStore } from '@/modules/etudiants/store';
import { useEcheancierStore } from '@/modules/finances/stores/echeanciers';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { formatMoney, somme, statutInfo, STATUTS_ECHEANCE } from '@/modules/finances/constants';
import { toQrDataUrl, chargeSituation } from '@/modules/finances/utils/qr';
import { imprimerSituation } from '@/modules/finances/utils/recu';

/**
 * Fiche de suivi d'un étudiant : « a-t-il payé le mois / le semestre / l'année ? ».
 *
 * La recherche est **serveur** (`GET /etudiants?search=`, indexé sur
 * matricule/nom/prénom) : on ne charge pas tout l'annuaire pour filtrer trois
 * lettres. L'échéancier vient de `GET /echeanciers/etudiant/:id` — sans limite,
 * contrairement au suivi global — et chaque ligne est une période (une
 * mensualité, un semestre, la tranche…) avec son statut calculé côté serveur.
 *
 * Le QR de contrôle n'encode pas d'URL : il porte les faits de la situation
 * (matricule, dû, réglé, reste, statut), lisibles hors ligne. Voir `utils/qr.js`.
 */

const etudiantStore = useEtudiantStore();
const echeancierStore = useEcheancierStore();
const notifications = useNotificationStore();

const recherche = ref('');
const resultats = ref([]);
const rechercheEnCours = ref(false);
const etudiantSelectionne = ref(null);
const qrDataUrl = ref(null);

const echeances = computed(() => echeancierStore.echeances);
const loading = computed(() => echeancierStore.loading);

// La première ligne de l'échéancier porte la classe et la périodicité du plan :
// elles sont identiques sur toutes les lignes d'un même étudiant.
const premiereEcheance = computed(() => echeances.value[0] ?? null);
const classeLibelle = computed(() => {
  const e = premiereEcheance.value;
  if (!e) return '';
  return [e.classe_code, e.filiere].filter(Boolean).join(' · ');
});
const periodiciteLibelle = computed(() => premiereEcheance.value?.periodicite ?? '');

let timer = null;

/** Recherche serveur déboncée : évite une requête par frappe. */
function onRecherche() {
  etudiantSelectionne.value = null;
  qrDataUrl.value = null;
  clearTimeout(timer);

  const terme = recherche.value.trim();
  if (terme.length < 2) {
    resultats.value = [];
    return;
  }

  timer = setTimeout(async () => {
    rechercheEnCours.value = true;
    await etudiantStore.fetchAll({ params: { search: terme } });
    resultats.value = (etudiantStore.items ?? []).slice(0, 20);
    rechercheEnCours.value = false;
  }, 300);
}

/** @param {any} etu */
async function selectionner(etu) {
  etudiantSelectionne.value = etu;
  resultats.value = [];
  recherche.value = `${etu.matricule} — ${etu.nom} ${etu.prenom}`;
  await echeancierStore.fetchByEtudiant(etu.id);
}

function reinitialiser() {
  etudiantSelectionne.value = null;
  qrDataUrl.value = null;
  recherche.value = '';
  resultats.value = [];
  echeancierStore.echeances = [];
}

const statutVariant = (statut) => statutInfo(STATUTS_ECHEANCE, statut).variant;
const statutLabel = (statut) => statutInfo(STATUTS_ECHEANCE, statut).label;

/**
 * Situation globale : montants cumulés et statut d'ensemble.
 *
 * Le statut d'ensemble suit la même hiérarchie que les échéances — le retard
 * l'emporte : dès qu'une période est en retard, l'étudiant est « en retard »,
 * même s'il a réglé les autres.
 */
const synthese = computed(() => {
  const du = somme(echeances.value, 'montant');
  const regle = somme(echeances.value, 'montant_regle');
  const reste = somme(echeances.value, 'reste');
  const taux = du > 0 ? Math.round((regle / du) * 100) : 0;

  let statut = 'EN_ATTENTE';
  if (du > 0 && reste <= 0) statut = 'PAYE';
  else if (echeances.value.some((e) => e.statut === 'EN_RETARD')) statut = 'EN_RETARD';
  else if (regle > 0) statut = 'PARTIEL';

  const info = statutInfo(STATUTS_ECHEANCE, statut);
  return { du, regle, reste, taux, statut, statutLabel: info.label, variant: info.variant };
});

/** Objet de contrôle partagé par le QR et l'impression. */
const situationControle = computed(() => ({
  matricule: etudiantSelectionne.value?.matricule,
  etudiant: etudiantSelectionne.value
    ? `${etudiantSelectionne.value.nom} ${etudiantSelectionne.value.prenom}`
    : '',
  classe: classeLibelle.value,
  du: synthese.value.du,
  regle: synthese.value.regle,
  reste: synthese.value.reste,
  statut: synthese.value.statutLabel,
  date: new Date().toISOString().slice(0, 10),
}));

// Régénère le QR dès que la situation change (nouvel étudiant, échéancier chargé).
watch(
  situationControle,
  async (situation) => {
    qrDataUrl.value =
      echeances.value.length > 0 ? await toQrDataUrl(chargeSituation(situation)) : null;
  },
  { deep: true }
);

async function imprimer() {
  try {
    await imprimerSituation(situationControle.value, echeances.value);
  } catch (error) {
    notifications.notifyError(error, 'Impossible d’ouvrir la fenêtre d’impression.');
  }
}
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

.resultats {
  z-index: 20;
  max-height: 320px;
  overflow-y: auto;
}

.qr-image {
  width: 160px;
  height: 160px;
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
