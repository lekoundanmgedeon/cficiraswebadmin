<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import Pagination from '@/components/shared/Pagination.vue';
import { formatDateTime } from '@/shared/utils/date';
import { tronquer } from '@/shared/utils/text';
import { cadrageInfo } from '../../constants';
import { getAudit, getAuditStatistiques } from '../../api';
import { useEspaceChatStore } from '../store';

/**
 * Journal et statistiques de l'assistant — **ADMIN uniquement**.
 *
 * ## Ce que cet écran sert à faire
 *
 * Trois choses, dans cet ordre d'usage :
 *
 *  1. **Tracer** — sur un ERP scolaire, savoir qui a demandé quoi relève de la
 *     traçabilité. Le journal porte l'auteur, sa question, le rôle qu'il avait
 *     *au moment de la question* (il a pu changer depuis) et le SQL exécuté.
 *  2. **Régler le prompt** — le filtre « échecs seuls » isole les questions qui
 *     n'ont pas abouti ; c'est le seul jeu d'évaluation dont dispose le module.
 *  3. **Suivre la facture** — la répartition par fournisseur porte les jetons,
 *     et c'est la seule vue qui rende les replis visibles : un échange
 *     journalisé chez un fournisseur que la configuration ne désigne pas est un
 *     appel qui a basculé après échec du nominal.
 *
 * L'accès est refusé en 403 côté serveur pour tout autre rôle : ce qu'on cache
 * ici n'est pas seulement masqué à l'écran.
 */

const store = useEspaceChatStore();

const stats = ref(null);
const lignes = ref([]);
const total = ref(0);
const chargement = ref(false);
const deplie = ref(null);

const filtres = ref({ q: '', aboutie: '', depuis: '', jusqu: '' });
const page = ref(1);
const parPage = ref(20);

/** @type {ReturnType<typeof setTimeout>|undefined} */
let minuterie;

async function charger() {
  chargement.value = true;
  try {
    await store.run(
      () =>
        getAudit({
          q: filtres.value.q.trim() || undefined,
          aboutie: filtres.value.aboutie || undefined,
          depuis: filtres.value.depuis || undefined,
          jusqu: filtres.value.jusqu || undefined,
          limite: parPage.value,
          offset: (page.value - 1) * parPage.value,
        }),
      {
        failure: "Erreur lors de la lecture du journal d'audit.",
        onSuccess: (r) => {
          lignes.value = r.data.lignes ?? [];
          total.value = r.data.total ?? 0;
        },
      }
    );
  } finally {
    chargement.value = false;
  }
}

onMounted(() => {
  charger();
  store.run(() => getAuditStatistiques(30), {
    failure: 'Erreur lors du calcul des statistiques.',
    onSuccess: (r) => {
      stats.value = r.data;
    },
  });
});

// La pagination recharge immédiatement ; les filtres sont débattus, sinon
// chaque frappe déclencherait une requête sur toute la table.
watch([page, parPage], charger);
watch(
  filtres,
  () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => {
      page.value = 1;
      charger();
    }, 400);
  },
  { deep: true }
);

const global = computed(() => stats.value?.global ?? null);

const tauxAboutissement = computed(() => {
  if (!global.value?.total) return null;
  return Math.round((global.value.abouties / global.value.total) * 100);
});

/** Le plus haut compte quotidien, pour mettre les barres à l'échelle. */
const maxJour = computed(() => Math.max(1, ...(stats.value?.parJour ?? []).map((j) => j.total)));
</script>

<template>
  <div class="audit-vue h-100 overflow-auto p-3">
    <div class="d-flex align-items-center mb-3">
      <div>
        <h5 class="mb-0">Journal et statistiques</h5>
        <p class="text-body-secondary small mb-0">
          Toutes les questions posées à l'assistant, tous utilisateurs et tous écrans confondus.
        </p>
      </div>
    </div>

    <!-- ── Les compteurs ────────────────────────────────────────────────── -->
    <div v-if="global" class="row g-2 mb-3">
      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body py-2 px-3">
            <div class="text-body-secondary audit-etiquette">Questions</div>
            <div class="fs-5 fw-bold">{{ global.total }}</div>
            <div class="small text-body-secondary">
              {{ global.conversations }} conversation{{ global.conversations > 1 ? 's' : '' }},
              {{ global.utilisateurs }} utilisateur{{ global.utilisateurs > 1 ? 's' : '' }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body py-2 px-3">
            <div class="text-body-secondary audit-etiquette">Abouties</div>
            <div
              class="fs-5 fw-bold"
              :class="tauxAboutissement < 80 ? 'text-warning' : 'text-success'"
            >
              {{ tauxAboutissement }} %
            </div>
            <div class="small text-body-secondary">
              {{ global.en_erreur }} en erreur sur {{ global.total }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body py-2 px-3">
            <div class="text-body-secondary audit-etiquette">Durée moyenne</div>
            <div class="fs-5 fw-bold">{{ (global.duree_moyenne_ms / 1000).toFixed(1) }} s</div>
            <div class="small text-body-secondary">
              {{ global.tours_moyens }} tours par question
            </div>
          </div>
        </div>
      </div>

      <div class="col-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body py-2 px-3">
            <div class="text-body-secondary audit-etiquette">Jetons</div>
            <div class="fs-5 fw-bold">
              {{ ((global.jetons_entree + global.jetons_sortie) / 1000).toFixed(0) }} k
            </div>
            <div class="small text-body-secondary">
              {{ (global.jetons_entree / 1000).toFixed(0) }} k entrée ·
              {{ (global.jetons_sortie / 1000).toFixed(0) }} k sortie
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-2 mb-3">
      <!-- ── Par fournisseur ───────────────────────────────────────────── -->
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body py-2 px-3">
            <h6 class="small fw-bold text-uppercase text-body-secondary mb-2">
              Par fournisseur et modèle
            </h6>
            <p class="small text-body-secondary mb-2">
              Un fournisseur qui apparaît sans être le nominal est un repli : l'appel y a basculé
              après échec du premier.
            </p>

            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0 audit-table">
                <thead>
                  <tr>
                    <th>Fournisseur</th>
                    <th>Modèle</th>
                    <th class="text-end">Questions</th>
                    <th class="text-end">Abouties</th>
                    <th class="text-end">Jetons</th>
                    <th class="text-end">Durée moy.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="f in stats?.parFournisseur ?? []"
                    :key="`${f.fournisseur}-${f.modele}`"
                  >
                    <td class="fw-semibold">{{ f.fournisseur }}</td>
                    <td class="text-body-secondary">{{ f.modele || '—' }}</td>
                    <td class="text-end">{{ f.total }}</td>
                    <td class="text-end">{{ f.abouties }}</td>
                    <td class="text-end">
                      {{ (((f.jetons_entree ?? 0) + (f.jetons_sortie ?? 0)) / 1000).toFixed(0) }} k
                    </td>
                    <td class="text-end">{{ ((f.duree_moyenne_ms ?? 0) / 1000).toFixed(1) }} s</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Par jour ──────────────────────────────────────────────────── -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body py-2 px-3 d-flex flex-column">
            <h6 class="small fw-bold text-uppercase text-body-secondary mb-2">Sur 30 jours</h6>

            <!-- Les jours sans question sont rendus par le serveur avec un
                 total nul : sans eux, deux points distants se liraient comme
                 s'ils se suivaient. -->
            <div class="d-flex align-items-end gap-1 flex-grow-1 audit-serie">
              <div
                v-for="jour in stats?.parJour ?? []"
                :key="jour.jour"
                class="audit-barre"
                :style="{ height: `${(jour.total / maxJour) * 100}%` }"
                :title="`${jour.jour.slice(0, 10)} — ${jour.total} question(s), ${jour.abouties} aboutie(s)`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Le journal ───────────────────────────────────────────────────── -->
    <div class="card border-0 shadow-sm">
      <div class="card-body py-2 px-3">
        <div class="row g-2 mb-2">
          <div class="col-md-5">
            <input
              v-model="filtres.q"
              type="search"
              class="form-control form-control-sm"
              placeholder="Rechercher dans les questions…"
            />
          </div>
          <div class="col-md-3">
            <select v-model="filtres.aboutie" class="form-select form-select-sm">
              <option value="">Toutes les questions</option>
              <option value="true">Abouties seulement</option>
              <option value="false">Échecs seulement</option>
            </select>
          </div>
          <div class="col-md-2">
            <input
              v-model="filtres.depuis"
              type="date"
              class="form-control form-control-sm"
              title="À partir du"
            />
          </div>
          <div class="col-md-2">
            <input
              v-model="filtres.jusqu"
              type="date"
              class="form-control form-control-sm"
              title="Jusqu'au"
            />
          </div>
        </div>

        <div v-if="chargement" class="text-center py-4">
          <span class="spinner-border spinner-border-sm text-secondary" role="status"></span>
        </div>

        <p v-else-if="!lignes.length" class="small text-body-secondary py-3 mb-0">
          Aucun échange ne correspond à ces filtres.
        </p>

        <div v-else class="table-responsive">
          <table class="table table-sm table-hover align-middle mb-0 audit-table">
            <thead>
              <tr>
                <th style="width: 1%"></th>
                <th>Date</th>
                <th>Auteur</th>
                <th>Question</th>
                <th>Écran</th>
                <th class="text-end">Durée</th>
                <th class="text-center">État</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="ligne in lignes" :key="ligne.id">
                <tr>
                  <td>
                    <button
                      type="button"
                      class="btn btn-sm btn-link p-0 text-body-secondary"
                      :title="deplie === ligne.id ? 'Replier' : 'Voir la réponse et le SQL'"
                      @click="deplie = deplie === ligne.id ? null : ligne.id"
                    >
                      <i
                        class="bi"
                        :class="deplie === ligne.id ? 'bi-chevron-down' : 'bi-chevron-right'"
                      ></i>
                    </button>
                  </td>
                  <td class="text-nowrap text-body-secondary">
                    {{ formatDateTime(ligne.created_at) }}
                  </td>
                  <td>
                    <span class="fw-semibold">{{ ligne.username || 'compte supprimé' }}</span>
                    <!-- Le rôle est celui **au moment de la question**, recopié
                         dans le journal : c'est lui qui explique ce que
                         l'assistant a pu lire, pas le rôle actuel. -->
                    <span class="text-body-secondary audit-role d-block">{{ ligne.role }}</span>
                  </td>
                  <td :title="ligne.question">{{ tronquer(ligne.question, 90) }}</td>
                  <td>
                    <span
                      class="badge rounded-pill"
                      :class="`bg-${cadrageInfo(ligne.cadrage).couleur}-subtle text-${cadrageInfo(ligne.cadrage).couleur}-emphasis`"
                    >
                      {{ cadrageInfo(ligne.cadrage).libelle }}
                    </span>
                  </td>
                  <td class="text-end text-nowrap">
                    {{ ligne.duree_ms ? `${(ligne.duree_ms / 1000).toFixed(1)} s` : '—' }}
                  </td>
                  <td class="text-center">
                    <i
                      class="bi"
                      :class="
                        ligne.aboutie
                          ? 'bi-check-circle text-success'
                          : 'bi-exclamation-circle text-danger'
                      "
                      :title="ligne.aboutie ? 'Aboutie' : ligne.erreur || 'Non aboutie'"
                    ></i>
                  </td>
                </tr>

                <tr v-if="deplie === ligne.id">
                  <td colspan="7" class="bg-body-tertiary">
                    <p v-if="ligne.erreur" class="small text-danger mb-2">
                      <i class="bi bi-exclamation-triangle me-1"></i>{{ ligne.erreur }}
                    </p>

                    <p class="small mb-2" style="white-space: pre-wrap">
                      {{ ligne.reponse || 'Aucune réponse rendue.' }}
                    </p>

                    <div class="small text-body-secondary mb-1">
                      {{ ligne.fournisseur }} · {{ ligne.modele }} · {{ ligne.nb_tours }} tour(s) ·
                      {{ ligne.jetons_entree ?? 0 }} + {{ ligne.jetons_sortie ?? 0 }} jetons
                    </div>

                    <pre
                      v-for="(appel, i) in (ligne.appels || []).filter((a) => a.sql)"
                      :key="i"
                      class="audit-sql mb-1"
                    ><code>{{ appel.sql }}</code></pre>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <Pagination
          v-model="page"
          v-model:items-per-page="parPage"
          :total-items="total"
          :items-per-page-options="[20, 50, 100]"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.audit-etiquette {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.audit-table {
  font-size: 0.8rem;
}

.audit-role {
  font-size: 0.66rem;
  text-transform: uppercase;
}

.audit-serie {
  min-height: 90px;
}

/* Une barre à zéro reste visible en trait fin : un jour sans question est une
   information, pas un vide dans la série. */
.audit-barre {
  flex: 1;
  min-height: 2px;
  background: var(--bs-primary, #6571ff);
  border-radius: 2px 2px 0 0;
  opacity: 0.75;
}

.audit-sql {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 0.74rem;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
}
</style>
