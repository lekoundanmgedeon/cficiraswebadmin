<script setup>
import { onMounted, ref, watch } from 'vue';
import Pagination from '@/components/shared/Pagination.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { formatDateTime } from '@/shared/utils/date';
import { getAuditFinancier, getAuditResume, getImports } from '../../api';
import { useParametresStore } from '../../store';

/**
 * Journaux d'exploitation — **ADMIN uniquement**.
 *
 * Deux journaux qui existaient en base sans qu'aucune route ne les expose :
 *
 * - **l'audit financier** (7 517 lignes), alimenté par des déclencheurs
 *   PostgreSQL sur les tables de finances. Il porte l'ancienne **et** la
 *   nouvelle valeur de chaque écriture : c'est la seule façon de répondre à
 *   « qui a changé ce montant, et depuis quoi » ;
 * - **le journal des imports**, compte rendu de chaque fichier chargé.
 *
 * ## Lecture seule, et rien d'autre
 *
 * Aucun bouton n'écrit ici, et il n'en existe pas côté serveur : un journal
 * qu'on peut modifier depuis l'interface qu'il surveille ne prouve plus rien.
 *
 * ## Les valeurs sont rendues brutes
 *
 * `anciennes_valeurs` et `nouvelles_valeurs` sont du `jsonb` dont les clés
 * dépendent de la table touchée. Les mettre en forme supposerait un schéma que
 * rien ne garantit ; on affiche donc les seuls champs qui ont changé, comparés
 * deux à deux.
 */

const store = useParametresStore();

const sousOnglet = ref('audit');

const audit = ref([]);
const totalAudit = ref(0);
const resume = ref([]);
const imports = ref([]);
const chargement = ref(false);
const deplie = ref(null);

const filtres = ref({ table: '', action: '', utilisateur: '' });

const ACTIONS = { C: 'Création', U: 'Modification', D: 'Suppression' };
const COULEURS = { C: 'success', U: 'warning', D: 'danger' };

async function chargerAudit() {
  chargement.value = true;
  try {
    await store.run(
      () =>
        getAuditFinancier({
          table: filtres.value.table || undefined,
          action: filtres.value.action || undefined,
          utilisateur: filtres.value.utilisateur.trim() || undefined,
          limite: 200,
        }),
      {
        failure: "Erreur lors de la lecture du journal d'audit.",
        onSuccess: (r) => {
          audit.value = r.data?.lignes ?? [];
          totalAudit.value = r.data?.total ?? 0;
        },
      }
    );
  } finally {
    chargement.value = false;
  }
}

async function chargerImports() {
  chargement.value = true;
  try {
    await store.run(() => getImports({ limite: 200 }), {
      failure: 'Erreur lors de la lecture du journal des imports.',
      onSuccess: (r) => {
        imports.value = r.data?.lignes ?? [];
      },
    });
  } finally {
    chargement.value = false;
  }
}

onMounted(() => {
  chargerAudit();
  store.run(() => getAuditResume(), {
    failure: "Erreur lors du résumé de l'audit.",
    onSuccess: (r) => {
      resume.value = r.data ?? [];
    },
  });
});

/** @type {ReturnType<typeof setTimeout>|undefined} */
let minuterie;

watch(
  filtres,
  () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(chargerAudit, 350);
  },
  { deep: true }
);

// Le journal des imports n'est chargé qu'à l'ouverture de son sous-onglet :
// c'est le même principe qu'`AppTabs`, une vue = une requête.
watch(sousOnglet, (valeur) => {
  if (valeur === 'imports' && imports.value.length === 0) chargerImports();
});

const {
  page,
  itemsPerPage,
  paginated: auditPage,
} = usePagination(audit, {
  resetKey: () => [filtres.value.table, filtres.value.action, filtres.value.utilisateur],
});

/**
 * Les seuls champs qui ont changé, comparés deux à deux.
 *
 * Afficher les deux objets entiers noierait la modification réelle — une ligne
 * de paiement compte une trentaine de colonnes, dont une seule a bougé.
 */
function differences(ligne) {
  const avant = ligne.anciennes_valeurs ?? {};
  const apres = ligne.nouvelles_valeurs ?? {};
  const cles = [...new Set([...Object.keys(avant), ...Object.keys(apres)])];

  return cles
    .filter((cle) => JSON.stringify(avant[cle]) !== JSON.stringify(apres[cle]))
    .map((cle) => ({ cle, avant: avant[cle], apres: apres[cle] }));
}
</script>

<template>
  <div>
    <ul class="nav nav-pills nav-sm mb-3 gap-1">
      <li class="nav-item">
        <button
          type="button"
          class="nav-link btn btn-sm"
          :class="sousOnglet === 'audit' ? 'active' : 'text-muted'"
          @click="sousOnglet = 'audit'"
        >
          <i class="bi bi-shield-check me-1"></i> Audit financier
          <span class="badge bg-light text-dark ms-1">{{ totalAudit }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          class="nav-link btn btn-sm"
          :class="sousOnglet === 'imports' ? 'active' : 'text-muted'"
          @click="sousOnglet = 'imports'"
        >
          <i class="bi bi-upload me-1"></i> Imports
        </button>
      </li>
    </ul>

    <!-- ── Audit financier ─────────────────────────────────────────────── -->
    <template v-if="sousOnglet === 'audit'">
      <div class="d-flex flex-wrap gap-2 mb-3">
        <div v-for="r in resume" :key="r.table_impactee" class="card border-0 shadow-sm flex-fill">
          <div class="card-body py-2 px-3">
            <code class="small">{{ r.table_impactee }}</code>
            <div class="fs-5 fw-bold">{{ r.total }}</div>
            <div class="small text-muted">
              {{ r.creations }} créations · {{ r.modifications }} modifications ·
              {{ r.suppressions }} suppressions
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-body p-3">
          <div class="row g-2 mb-3">
            <div class="col-md-4">
              <select v-model="filtres.table" class="form-select form-select-sm">
                <option value="">Toutes les tables</option>
                <option v-for="r in resume" :key="r.table_impactee" :value="r.table_impactee">
                  {{ r.table_impactee }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <select v-model="filtres.action" class="form-select form-select-sm">
                <option value="">Toutes les actions</option>
                <option v-for="(libelle, code) in ACTIONS" :key="code" :value="code">
                  {{ libelle }}
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <input
                v-model="filtres.utilisateur"
                type="search"
                class="form-control form-control-sm"
                placeholder="Auteur…"
              />
            </div>
          </div>

          <LoadingSpinner v-if="chargement && !audit.length" />

          <EmptyState
            v-else-if="!audit.length"
            title="Aucune écriture"
            description="Aucune écriture ne correspond à ces filtres."
            :size="80"
          />

          <div v-else class="table-responsive">
            <table class="table table-sm table-hover align-middle mb-0 journal-table">
              <thead>
                <tr>
                  <th style="width: 1%"></th>
                  <th>Date</th>
                  <th>Table</th>
                  <th>Action</th>
                  <th>Auteur</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="ligne in auditPage" :key="ligne.id">
                  <tr>
                    <td>
                      <button
                        type="button"
                        class="btn btn-sm btn-link p-0 text-muted"
                        :title="deplie === ligne.id ? 'Replier' : 'Voir ce qui a changé'"
                        @click="deplie = deplie === ligne.id ? null : ligne.id"
                      >
                        <i
                          class="bi"
                          :class="deplie === ligne.id ? 'bi-chevron-down' : 'bi-chevron-right'"
                        ></i>
                      </button>
                    </td>
                    <td class="text-nowrap text-muted">
                      {{ formatDateTime(ligne.horodatage) }}
                    </td>
                    <td>
                      <code class="small">{{ ligne.table_impactee }}</code>
                    </td>
                    <td>
                      <span
                        class="badge rounded-pill"
                        :class="`bg-light text-${COULEURS[ligne.action]} border`"
                      >
                        {{ ACTIONS[ligne.action] }}
                      </span>
                    </td>
                    <td class="small">{{ ligne.utilisateur }}</td>
                  </tr>

                  <tr v-if="deplie === ligne.id">
                    <td colspan="5" class="bg-light">
                      <div v-if="differences(ligne).length" class="table-responsive">
                        <table class="table table-sm mb-0 journal-diff">
                          <thead>
                            <tr>
                              <th>Champ</th>
                              <th>Avant</th>
                              <th>Après</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="d in differences(ligne)" :key="d.cle">
                              <td>
                                <code class="small">{{ d.cle }}</code>
                              </td>
                              <td class="text-danger">{{ d.avant ?? '—' }}</td>
                              <td class="text-success">{{ d.apres ?? '—' }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p v-else class="small text-muted mb-0">
                        Aucun champ modifié — écriture de création ou de suppression.
                      </p>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <Pagination
            v-if="audit.length"
            v-model="page"
            v-model:items-per-page="itemsPerPage"
            :total-items="audit.length"
          />
        </div>
      </div>
    </template>

    <!-- ── Imports ─────────────────────────────────────────────────────── -->
    <div v-else class="card border-0 shadow-sm">
      <div class="card-body p-3">
        <LoadingSpinner v-if="chargement && !imports.length" />

        <EmptyState
          v-else-if="!imports.length"
          title="Aucun import"
          description="Aucun fichier n'a encore été importé."
          :size="80"
        />

        <div v-else class="table-responsive">
          <table class="table table-sm align-middle mb-0 journal-table">
            <thead>
              <tr>
                <th>Fichier</th>
                <th>Type</th>
                <th class="text-end">Lignes</th>
                <th class="text-end">Réussies</th>
                <th class="text-end">En échec</th>
                <th>Auteur</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in imports" :key="i.id">
                <td class="font-monospace small">{{ i.fichier }}</td>
                <td>{{ i.type_import }}</td>
                <td class="text-end">{{ i.lignes_total }}</td>
                <td class="text-end text-success">{{ i.lignes_reussies }}</td>
                <td class="text-end" :class="i.lignes_echec ? 'text-danger fw-bold' : ''">
                  {{ i.lignes_echec }}
                </td>
                <td class="small">{{ i.username ?? '—' }}</td>
                <td class="small text-muted">{{ formatDateTime(i.date_import) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.journal-table {
  font-size: 0.82rem;
}

.journal-diff {
  font-size: 0.78rem;
}

.nav-sm .nav-link {
  font-size: 0.84rem;
}
</style>
