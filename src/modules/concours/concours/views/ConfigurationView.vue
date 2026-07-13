<script setup>
import { computed, markRaw, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import AppTabs from '@/shared/components/AppTabs.vue';
import PageHeader from '@/shared/components/PageHeader.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import { formatDate } from '@/shared/utils/date';
import TabEpreuves from '../../epreuve/components/TabEpreuves.vue';
import TabCandidats from '../../candidat/components/TabCandidats.vue';
import TabNotes from '../../candidat/components/TabNotes.vue';
import TabDeliberation from '../components/TabDeliberation.vue';
import { useConcoursStore } from '../store';
import { statutConcoursInfo } from '../../constants';

const props = defineProps({
  /** Identifiant du concours, injecté par le router. */
  id: { type: String, required: true },
});

/**
 * Configuration d'un concours : épreuves, candidats, notes, délibération.
 *
 * Les quatre sous-onglets sont ceux de l'original, dans le même ordre. Ils
 * étaient rendus par un conteneur Bootstrap qui **montait ses quatre panneaux
 * d'un coup** : chacun exécutait son `onMounted` — et ses requêtes — au
 * chargement de la page, y compris ceux que l'utilisateur n'ouvrait jamais.
 *
 * Ils lisaient par ailleurs tous `route.params.id` de leur côté ; l'identifiant
 * est désormais passé en prop, depuis la route. `TabDeliberation` en faisait un
 * `Number(route.params.id)` — sur un **UUID**, cela vaut `NaN`.
 */

const router = useRouter();
const concoursStore = useConcoursStore();
const { loading } = storeToRefs(concoursStore);

onMounted(() => concoursStore.fetchAll());

const concours = computed(() => concoursStore.getById(props.id));

const statut = computed(() => statutConcoursInfo(concours.value?.statut));

const tabs = computed(() => [
  {
    id: 'epreuves',
    label: '1. Épreuves',
    component: markRaw(TabEpreuves),
    props: { concoursId: props.id },
  },
  {
    id: 'candidatures',
    label: '2. Candidatures',
    component: markRaw(TabCandidats),
    props: { concoursId: props.id },
  },
  {
    id: 'notes',
    label: '3. Saisie des Notes',
    component: markRaw(TabNotes),
    props: { concoursId: props.id },
  },
  {
    id: 'deliberation',
    label: '4. Délibération & Publication',
    component: markRaw(TabDeliberation),
    props: { concoursId: props.id },
  },
]);

const goBack = () => router.push({ name: 'EditionConcours' });
</script>

<template>
  <div>
    <PageHeader
      :title="concours?.designation ?? 'Configuration du concours'"
      :subtitle="concours?.libelle_type ?? ''"
      :breadcrumb="['concours', 'configuration']"
    >
      <template #actions>
        <button type="button" class="btn btn-outline-secondary mt-2 mt-xl-0" @click="goBack">
          <i class="mdi mdi-arrow-left me-1"></i> Retour
        </button>
      </template>
    </PageHeader>

    <LoadingSpinner v-if="loading && !concours" />

    <EmptyState
      v-else-if="!concours"
      title="Concours introuvable"
      description="Ce concours n'existe pas, ou il a été supprimé."
    />

    <template v-else>
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Statut</span>
            <span
              class="badge rounded-pill px-3 py-2"
              :class="`bg-${statut.variant}-subtle text-${statut.variant}`"
            >
              {{ statut.label }}
            </span>
          </div>

          <div class="text-end">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Période</span>
            <span class="fw-semibold text-dark">
              {{ formatDate(concours.date_debut, '—') }} —
              {{ formatDate(concours.date_fin, '—') }}
            </span>
          </div>

          <div class="text-end">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Limite de dossier
            </span>
            <span class="fw-semibold text-dark">
              {{ formatDate(concours.date_limite_inscription, '—') }}
            </span>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-12 grid-margin stretch-card">
          <div class="card">
            <div class="card-body dashboard-tabs p-0">
              <AppTabs :tabs="tabs" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
