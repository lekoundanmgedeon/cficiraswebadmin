<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import AppTabs from '@/shared/components/AppTabs.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import ProfilTab from '../components/tabs/ProfilTab.vue';
import ParcoursTab from '../components/tabs/ParcoursTab.vue';
import SituationFinanciereTab from '../components/tabs/SituationFinanciereTab.vue';
import PiecesTab from '../components/tabs/PiecesTab.vue';
import { useDossierStore } from '../store';
import { dossierInfo } from '../constants';

const props = defineProps({
  /** Identifiant de l'**étudiant** (le dossier n'a pas de route à lui). */
  id: { type: String, required: true },
});

/**
 * Dossier scolaire d'un étudiant.
 *
 * `DossierAcademique.vue` fabriquait son étudiant après un `setTimeout(800)`
 * imitant une latence réseau :
 *
 * ```js
 * await new Promise((resolve) => setTimeout(resolve, 800)); // Faux délai
 * currentStudent.value = { matricule: 'ETU-2026-001', nom: 'DIOP', ... };
 * ```
 *
 * Ses cinq onglets servaient tous des `ref([...])` codés en dur. Quatre d'entre
 * eux ont désormais une source réelle. Le cinquième — « Assiduité & Discipline » —
 * a été retiré : **aucune route d'absence n'existe dans le backend**, et le
 * conserver aurait entretenu l'illusion d'un suivi qui n'existe pas.
 *
 * L'ancienne route était `/dossiers-scolaires/:id/global-informations` ; elle se
 * simplifie en `/dossiers-scolaires/:id`.
 */

const router = useRouter();
const dossierStore = useDossierStore();
const { dossier, loading } = storeToRefs(dossierStore);

const notFound = ref(false);

onMounted(async () => {
  const result = await dossierStore.fetchDossier(props.id);
  notFound.value = result === undefined;
});

const fullName = computed(() =>
  dossier.value ? `${dossier.value.nom ?? ''} ${dossier.value.prenom ?? ''}`.trim() : ''
);

const statut = computed(() => dossierInfo(dossier.value?.statut_dossier));

const tabs = computed(() => [
  { id: 'profil', label: 'Profil', component: ProfilTab },
  {
    id: 'parcours',
    label: 'Parcours académique',
    component: ParcoursTab,
    props: { etudiantId: props.id },
  },
  {
    id: 'finance',
    label: 'Situation financière',
    component: SituationFinanciereTab,
    props: { etudiantId: props.id },
  },
  { id: 'pieces', label: 'Pièces justificatives', component: PiecesTab },
]);

const goBack = () => router.push({ name: 'DossiersScolaires' });

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      :title="fullName || 'Dossier scolaire'"
      :subtitle="dossier?.matricule ? `Matricule ${dossier.matricule}` : ''"
      :breadcrumb="['portail', 'scolarité', 'dossiers', 'fiche']"
    >
      <template #actions>
        <button type="button" class="btn btn-outline-secondary me-3 mt-2 mt-xl-0" @click="goBack">
          <i class="mdi mdi-arrow-left me-1"></i> Retour
        </button>

        <button
          type="button"
          class="btn btn-light bg-white btn-icon mt-2 mt-xl-0"
          title="Imprimer le dossier"
          @click="print"
        >
          <i class="mdi mdi-printer text-muted"></i>
        </button>
      </template>
    </PageHeader>

    <LoadingSpinner v-if="loading && !dossier" />

    <EmptyState
      v-else-if="notFound || !dossier"
      title="Dossier introuvable"
      description="Ce dossier n'existe pas, ou l'étudiant a été supprimé."
    />

    <template v-else>
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">
              Statut du dossier
            </span>
            <span
              class="badge rounded-pill px-3 py-2"
              :class="`bg-${statut.variant}-subtle text-${statut.variant}`"
            >
              {{ statut.label }}
            </span>
          </div>

          <div class="text-end">
            <span class="text-muted small fw-semibold text-uppercase d-block mb-1">Filière</span>
            <span class="fw-semibold text-dark">{{ dossier.filiere_nom ?? '—' }}</span>
          </div>
        </div>
      </div>

      <PageCard>
        <AppTabs :tabs="tabs" />
      </PageCard>
    </template>
  </div>
</template>
