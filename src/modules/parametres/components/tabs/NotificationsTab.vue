<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import Pagination from '@/components/shared/Pagination.vue';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import { usePagination } from '@/shared/composables/usePagination';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { formatDateTime, formatRelatif } from '@/shared/utils/date';
import { tronquer } from '@/shared/utils/text';
import {
  diffuserNotification,
  getDestinataires,
  getNotifications,
  getNotificationsStats,
  purgerNotifications,
  supprimerNotification,
} from '../../api';
import { useParametresStore } from '../../store';

/**
 * Notifications adressées aux étudiants.
 *
 * ## Ce qu'elles sont — et ce que cet écran ne prétend pas être
 *
 * `notifications.etudiant_id` est `NOT NULL` : ce sont des **messages aux
 * étudiants**, pas des notifications d'interface pour les agents. Cet écran les
 * administre.
 *
 * ⚠️ **Aucune n'est produite par l'application.** Les 1 778 lignes en base ont
 * été semées par le jeu de démonstration, en trois lots ; aucune fonction ni
 * aucun déclencheur ne les écrit. Un producteur (échéance dépassée, note
 * publiée) reste à écrire — l'écran le dit plutôt que de laisser croire à un
 * service qui tournerait.
 *
 * ## Le décompte avant la diffusion
 *
 * Une diffusion écrit **une ligne par destinataire** : « à tous » vaut 893
 * lignes. Le nombre est demandé au serveur et affiché avant d'écrire — c'est la
 * seule protection contre un envoi massif fait par erreur.
 */

const store = useParametresStore();
const notifications = useNotificationStore();

const lignes = ref([]);
const total = ref(0);
const stats = ref([]);
const chargement = ref(false);
const aSupprimer = ref(null);
const purgeOuverte = ref(false);

const filtres = ref({ q: '', type: '', lu: '' });

const diffusion = ref({ titre: '', message: '', type: 'INFORMATION', classe: '' });
const nbDestinataires = ref(null);
const enDiffusion = ref(false);
const formulaireOuvert = ref(false);

/** Miroir de la contrainte `notifications_type_notification_check`. */
const TYPES = {
  ALERTE: { libelle: 'Alerte', couleur: 'danger' },
  INFORMATION: { libelle: 'Information', couleur: 'info' },
  RAPPEL: { libelle: 'Rappel', couleur: 'warning' },
  NOTE_PUBLIEE: { libelle: 'Note publiée', couleur: 'success' },
  FINANCE: { libelle: 'Finance', couleur: 'primary' },
};

const typeInfo = (code) => TYPES[code] ?? { libelle: code, couleur: 'secondary' };

async function charger() {
  chargement.value = true;
  try {
    await store.run(
      () =>
        getNotifications({
          q: filtres.value.q.trim() || undefined,
          type: filtres.value.type || undefined,
          lu: filtres.value.lu === '' ? undefined : filtres.value.lu,
          limite: 200,
        }),
      {
        failure: 'Erreur lors du chargement des notifications.',
        onSuccess: (r) => {
          lignes.value = r.data?.lignes ?? [];
          total.value = r.data?.total ?? 0;
        },
      }
    );
  } finally {
    chargement.value = false;
  }
}

onMounted(() => {
  charger();
  store.run(() => getNotificationsStats(), {
    failure: 'Erreur lors du calcul des statistiques.',
    onSuccess: (r) => {
      stats.value = r.data ?? [];
    },
  });
});

/** @type {ReturnType<typeof setTimeout>|undefined} */
let minuterie;

watch(
  filtres,
  () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(charger, 350);
  },
  { deep: true }
);

const {
  page,
  itemsPerPage,
  paginated: notificationsPage,
} = usePagination(lignes, {
  resetKey: () => [filtres.value.q, filtres.value.type, filtres.value.lu],
});

const totalNonLues = computed(() => stats.value.reduce((somme, s) => somme + s.non_lues, 0));

/** Le décompte est redemandé à chaque changement de cible, avant toute écriture. */
watch(
  () => diffusion.value.classe,
  async () => {
    nbDestinataires.value = null;
    const r = await store.run(
      () => getDestinataires(diffusion.value.classe ? { classe: diffusion.value.classe } : {}),
      { failure: 'Le nombre de destinataires n’a pas pu être calculé.' }
    );
    if (r !== undefined) nbDestinataires.value = r.data?.nombre ?? 0;
  },
  { immediate: true }
);

const diffusionValide = computed(
  () => diffusion.value.titre.trim() && diffusion.value.message.trim() && nbDestinataires.value > 0
);

async function envoyer() {
  if (!diffusionValide.value || enDiffusion.value) return;
  enDiffusion.value = true;

  try {
    const resultat = await store.run(
      () =>
        diffuserNotification({
          titre: diffusion.value.titre,
          message: diffusion.value.message,
          type: diffusion.value.type,
          classe: diffusion.value.classe || undefined,
        }),
      { failure: "La notification n'a pas pu être diffusée." }
    );

    if (resultat !== undefined) {
      notifications.notifySuccess(resultat.message);
      diffusion.value = { titre: '', message: '', type: 'INFORMATION', classe: '' };
      formulaireOuvert.value = false;
      await charger();
    }
  } finally {
    enDiffusion.value = false;
  }
}

async function confirmerSuppression() {
  const cible = aSupprimer.value;
  aSupprimer.value = null;
  if (!cible) return;

  const r = await store.run(() => supprimerNotification(cible.id), {
    failure: "La notification n'a pas pu être supprimée.",
    success: 'Notification supprimée.',
  });
  if (r !== undefined) await charger();
}

async function confirmerPurge() {
  purgeOuverte.value = false;
  const r = await store.run(() => purgerNotifications(), {
    failure: 'La purge a échoué.',
  });
  if (r !== undefined) {
    notifications.notifySuccess(r.message);
    await charger();
  }
}
</script>

<template>
  <div>
    <!-- ── Répartition ─────────────────────────────────────────────────── -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <div v-for="s in stats" :key="s.type_notification" class="card border-0 shadow-sm flex-fill">
        <div class="card-body py-2 px-3">
          <span
            class="badge rounded-pill"
            :class="`bg-light text-${typeInfo(s.type_notification).couleur} border`"
          >
            {{ typeInfo(s.type_notification).libelle }}
          </span>
          <div class="fs-5 fw-bold mt-1">{{ s.total }}</div>
          <div class="small text-muted">
            {{ s.non_lues }} non lue{{ s.non_lues > 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Ce que l'écran ne fait pas : le dire est ce qui empêche de croire à un
         service qui tournerait en arrière-plan. -->
    <div class="alert alert-light border small d-flex gap-2 py-2">
      <i class="bi bi-info-circle text-primary flex-shrink-0 mt-1"></i>
      <div>
        Ces messages sont adressés <strong>aux étudiants</strong>. Aucun n'est produit
        automatiquement aujourd'hui : les {{ total }} lignes présentes ont été semées avec le jeu de
        données, et seule la diffusion manuelle ci-dessous en crée. Un producteur automatique
        (échéance dépassée, note publiée) reste à écrire.
      </div>
    </div>

    <!-- ── Diffusion ───────────────────────────────────────────────────── -->
    <div class="card border-0 shadow-sm mb-3">
      <button
        type="button"
        class="btn text-start w-100 d-flex align-items-center gap-2 px-3 py-2"
        @click="formulaireOuvert = !formulaireOuvert"
      >
        <i class="bi" :class="formulaireOuvert ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
        <span class="small fw-bold">Diffuser une notification</span>
      </button>

      <div v-if="formulaireOuvert" class="card-body pt-0 px-3 pb-3">
        <div class="row g-2">
          <div class="col-md-6">
            <label class="form-label small fw-bold" for="diff-titre">Titre</label>
            <input
              id="diff-titre"
              v-model="diffusion.titre"
              type="text"
              class="form-control form-control-sm"
              maxlength="150"
            />
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold" for="diff-type">Type</label>
            <select id="diff-type" v-model="diffusion.type" class="form-select form-select-sm">
              <option v-for="(info, code) in TYPES" :key="code" :value="code">
                {{ info.libelle }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold" for="diff-classe"> Classe ciblée </label>
            <input
              id="diff-classe"
              v-model="diffusion.classe"
              type="text"
              class="form-control form-control-sm"
              placeholder="Toutes"
            />
          </div>
          <div class="col-12">
            <label class="form-label small fw-bold" for="diff-message">Message</label>
            <textarea
              id="diff-message"
              v-model="diffusion.message"
              class="form-control form-control-sm"
              rows="2"
            ></textarea>
          </div>
        </div>

        <div class="d-flex align-items-center justify-content-between mt-3">
          <!-- Le décompte vient du serveur et précède l'écriture : c'est la
               seule protection contre une diffusion massive par erreur. -->
          <p class="small mb-0" :class="nbDestinataires > 100 ? 'text-warning' : 'text-muted'">
            <i class="bi bi-people me-1"></i>
            <template v-if="nbDestinataires === null">décompte en cours…</template>
            <template v-else-if="nbDestinataires === 0">
              Aucun étudiant ne correspond à cette cible.
            </template>
            <template v-else>
              <strong>{{ nbDestinataires }}</strong> destinataire{{
                nbDestinataires > 1 ? 's' : ''
              }}
              — autant de lignes écrites.
            </template>
          </p>

          <button
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="!diffusionValide || enDiffusion"
            @click="envoyer"
          >
            <span
              v-if="enDiffusion"
              class="spinner-border spinner-border-sm me-1"
              role="status"
            ></span>
            Diffuser
          </button>
        </div>
      </div>
    </div>

    <!-- ── Liste ───────────────────────────────────────────────────────── -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-3">
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-5">
            <input
              v-model="filtres.q"
              type="search"
              class="form-control form-control-sm"
              placeholder="Titre, message, matricule, nom…"
            />
          </div>
          <div class="col-md-3">
            <select v-model="filtres.type" class="form-select form-select-sm">
              <option value="">Tous les types</option>
              <option v-for="(info, code) in TYPES" :key="code" :value="code">
                {{ info.libelle }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="filtres.lu" class="form-select form-select-sm">
              <option value="">Lues et non lues</option>
              <option value="true">Lues</option>
              <option value="false">Non lues</option>
            </select>
          </div>
          <div class="col-md-2 text-end">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary w-100"
              title="Supprimer les notifications lues et anciennes"
              @click="purgeOuverte = true"
            >
              <i class="bi bi-trash me-1"></i> Purger
            </button>
          </div>
        </div>

        <LoadingSpinner v-if="chargement && !lignes.length" />

        <EmptyState
          v-else-if="!lignes.length"
          title="Aucune notification"
          description="Aucune notification ne correspond à ces filtres."
          :size="80"
        />

        <div v-else class="table-responsive">
          <table class="table table-sm table-hover align-middle mb-0 notif-table">
            <thead>
              <tr>
                <th>Destinataire</th>
                <th>Message</th>
                <th>Type</th>
                <th>Émise</th>
                <th class="text-center">Lue</th>
                <th class="text-end"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in notificationsPage" :key="n.id">
                <td>
                  <div class="fw-bold">{{ n.prenom }} {{ n.nom }}</div>
                  <div class="small text-muted font-monospace">
                    {{ n.matricule }} · {{ n.classe_code ?? '—' }}
                  </div>
                </td>
                <td>
                  <div class="fw-bold">{{ n.titre }}</div>
                  <div class="small text-muted" :title="n.message">
                    {{ tronquer(n.message, 70) }}
                  </div>
                </td>
                <td>
                  <span
                    class="badge rounded-pill"
                    :class="`bg-light text-${typeInfo(n.type_notification).couleur} border`"
                  >
                    {{ typeInfo(n.type_notification).libelle }}
                  </span>
                </td>
                <td class="small text-muted" :title="formatDateTime(n.created_at)">
                  {{ formatRelatif(n.created_at) }}
                </td>
                <td class="text-center">
                  <i
                    class="bi"
                    :class="n.lu ? 'bi-check-circle text-success' : 'bi-circle text-muted'"
                    :title="n.lu ? formatDateTime(n.date_lecture) : 'Non lue'"
                  ></i>
                </td>
                <td class="text-end">
                  <button
                    type="button"
                    class="btn btn-sm btn-link text-danger p-0"
                    title="Supprimer"
                    @click="aSupprimer = n"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-if="lignes.length"
          v-model="page"
          v-model:items-per-page="itemsPerPage"
          :total-items="lignes.length"
        />
      </div>
    </div>

    <ConfirmModal
      :model-value="Boolean(aSupprimer)"
      title="Supprimer cette notification ?"
      :message="`« ${aSupprimer?.titre} », adressée à ${aSupprimer?.prenom} ${aSupprimer?.nom}. L'action est définitive.`"
      confirm-label="Supprimer"
      @update:model-value="aSupprimer = null"
      @confirm="confirmerSuppression"
    />

    <ConfirmModal
      v-model="purgeOuverte"
      title="Purger les anciennes notifications ?"
      :message="`Seules les notifications déjà lues et plus anciennes que la rétention réglée seront supprimées. Les ${totalNonLues} non lues sont conservées, quel que soit leur âge.`"
      confirm-label="Purger"
      @confirm="confirmerPurge"
    />
  </div>
</template>

<style scoped>
.notif-table {
  font-size: 0.82rem;
}
</style>
