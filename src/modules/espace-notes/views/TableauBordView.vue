<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/core/auth/authStore';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import { typeEpreuveLabel } from '@/modules/examens/constants';
import { useEspaceNotesStore } from '../store';
import { capacitesDe, ETAPES, peut, roleInfo } from '../constants';
import BandeauEtapes from '../components/BandeauEtapes.vue';

/**
 * Accueil de l'espace notes.
 *
 * Il répond à trois questions, et rien d'autre : *où en est la campagne de
 * notation*, *qu'ai-je le droit de faire*, et *par où commencer*. Tous les
 * chiffres affichés sont dérivés des lectures de contexte déjà nécessaires à
 * l'écran de saisie — aucun appel supplémentaire, aucun compteur inventé.
 */

const espace = useEspaceNotesStore();
const auth = useAuthStore();

const { classes, evaluations, loading } = storeToRefs(espace);

const role = computed(() => auth.user?.role ?? null);
const infosRole = computed(() => roleInfo(role.value));
const capacites = computed(() => capacitesDe(role.value));

/** Les évaluations rattachées aux sessions actives — le périmètre notable. */
const evaluationsActives = computed(() => {
  const sessionsActives = new Set(espace.sessionsActives.map((session) => String(session.id)));
  return evaluations.value.filter((evaluation) =>
    sessionsActives.has(String(evaluation.session_id))
  );
});

const parType = computed(() => {
  const compteurs = new Map();
  for (const evaluation of evaluationsActives.value) {
    const type = evaluation.type_eval ?? '—';
    compteurs.set(type, (compteurs.get(type) ?? 0) + 1);
  }
  return [...compteurs.entries()].map(([type, total]) => ({ type, total }));
});

const etapesDuRole = computed(() =>
  ETAPES.filter((etape) => etape.capacite && peut(role.value, etape.capacite))
);

onMounted(async () => {
  await Promise.all([espace.fetchContexte(), auth.fetchCurrentUser()]);
});
</script>

<template>
  <div>
    <div class="row g-3 mb-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h2 class="h6 text-uppercase text-secondary small fw-bold mb-3">
              Le circuit d'une note
            </h2>
            <BandeauEtapes :statut="null" :conforme="false" />
            <p class="text-muted small mb-0 mt-3">
              La base ne connaît que trois statuts — <code>SAISIE</code>, <code>VALIDEE</code>,
              <code>PUBLIEE</code>. La vérification n'en est pas un : c'est un contrôle de
              conformité recalculé à chaque ouverture d'une grille, jamais enregistré.
            </p>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h2 class="h6 text-uppercase text-secondary small fw-bold mb-2">Vos attributions</h2>
            <p class="fw-bold mb-1">{{ infosRole.label }}</p>
            <p class="text-muted small">{{ infosRole.mission }}</p>

            <ul class="list-unstyled mb-0 small">
              <li v-for="etape in etapesDuRole" :key="etape.id" class="mb-1">
                <i class="bi bi-check2 text-success me-1"></i>{{ etape.description }}
              </li>
              <li v-if="!etapesDuRole.length" class="text-muted fst-italic">
                Ce rôle n'a aucune action de flux : consultation seule.
              </li>
            </ul>

            <div class="mt-3 d-flex flex-wrap gap-1">
              <span
                v-for="capacite in capacites"
                :key="capacite"
                class="badge bg-secondary-subtle text-secondary text-capitalize"
              >
                {{ capacite.replace('_', ' ') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading && !classes.length" />

    <template v-else>
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-primary border-3">
            <span class="text-muted small text-uppercase d-block mb-1">Classes</span>
            <span class="fw-bold font-monospace fs-4">{{ classes.length }}</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-success border-3">
            <span class="text-muted small text-uppercase d-block mb-1">Sessions actives</span>
            <span class="fw-bold font-monospace fs-4">{{ espace.sessionsActives.length }}</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-info border-3">
            <span class="text-muted small text-uppercase d-block mb-1">Évaluations notables</span>
            <span class="fw-bold font-monospace fs-4">{{ evaluationsActives.length }}</span>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm p-3 border-start border-warning border-3">
            <span class="text-muted small text-uppercase d-block mb-1">Évaluations déclarées</span>
            <span class="fw-bold font-monospace fs-4">{{ evaluations.length }}</span>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h2 class="h6 text-uppercase text-secondary small fw-bold mb-3">
                Sessions ouvertes à la saisie
              </h2>

              <EmptyState
                v-if="!espace.sessionsActives.length"
                title="Aucune session active"
                description="Une session doit passer à l'état « active » depuis l'écran des examens avant toute saisie."
                :size="70"
              />

              <ul v-else class="list-group list-group-flush">
                <li
                  v-for="session in espace.sessionsActives"
                  :key="session.id"
                  class="list-group-item px-0 d-flex justify-content-between align-items-center"
                >
                  <span>
                    <strong>{{ session.code }}</strong>
                    <span class="text-muted small d-block">{{ session.designation }}</span>
                  </span>
                  <span class="badge bg-success-subtle text-success">{{
                    session.type_session
                  }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex flex-column">
              <h2 class="h6 text-uppercase text-secondary small fw-bold mb-3">
                Nature des évaluations notables
              </h2>

              <EmptyState
                v-if="!parType.length"
                title="Rien à noter"
                description="Aucune évaluation n'est rattachée à une session active."
                :size="70"
              />

              <ul v-else class="list-unstyled mb-0">
                <li
                  v-for="ligne in parType"
                  :key="ligne.type"
                  class="d-flex justify-content-between align-items-center mb-2"
                >
                  <span>{{ typeEpreuveLabel(ligne.type) }}</span>
                  <span class="badge bg-light text-dark border font-monospace">
                    {{ ligne.total }}
                  </span>
                </li>
              </ul>

              <RouterLink
                :to="{ name: 'EspaceNotesGrille' }"
                class="btn btn-primary btn-sm mt-auto align-self-start"
              >
                <i class="bi bi-table me-1"></i> Ouvrir une grille de notes
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
