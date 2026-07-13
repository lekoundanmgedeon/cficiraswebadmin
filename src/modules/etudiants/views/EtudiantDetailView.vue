<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import AppTabs from '@/shared/components/AppTabs.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import EtudiantInfosTab from '../components/EtudiantInfosTab.vue';
import EtudiantParcoursTab from '../components/EtudiantParcoursTab.vue';
import EtudiantFormModal from '../components/EtudiantFormModal.vue';
import { useEtudiantStore } from '../store';
import { useEtudiantForm } from '../composables/useEtudiantForm';

const props = defineProps({
  /** Injecté par le router (`props: true`). */
  id: { type: String, required: true },
});

/**
 * Fiche d'un étudiant.
 *
 * L'ancienne version (`views/etudiants/components/details/DetailEtudiant.vue`)
 * déclarait **quatre onglets pour deux panneaux** : « Tuteur » et « Dossier
 * complet » pointaient tous deux sur un `#sales2` qui n'existait pas — les
 * cliquer ne faisait rien. Trois de ses `<li>` partageaient de surcroît le même
 * `id="sales-tab"`.
 *
 * Elle affectait par ailleurs `etudiant.value = response` sans déballer
 * l'enveloppe `{ success, data }` du backend : la fiche lisait donc
 * `enveloppe.nom`, toujours `undefined`. Le client HTTP déballe désormais, et le
 * store expose l'étudiant dans `item`.
 *
 * Son second onglet (« Fiche académique ») présentait enfin des champs d'agent —
 * grade, fonction, unité de service, département — étrangers au modèle étudiant.
 * Il cède la place au parcours académique, qui, lui, correspond à un endpoint réel.
 */

const router = useRouter();
const etudiantStore = useEtudiantStore();
const { item: etudiant, loading } = storeToRefs(etudiantStore);
const { openEdit } = useEtudiantForm();

const notFound = ref(false);

onMounted(async () => {
  const result = await etudiantStore.fetchById(props.id);
  notFound.value = result === undefined;
});

const fullName = computed(() =>
  etudiant.value ? `${etudiant.value.nom ?? ''} ${etudiant.value.prenom ?? ''}`.trim() : ''
);

const tabs = computed(() => [
  { id: 'infos', label: 'Informations', component: EtudiantInfosTab },
  {
    id: 'parcours',
    label: 'Parcours académique',
    component: EtudiantParcoursTab,
    props: { etudiantId: props.id },
  },
]);

const goBack = () => router.push({ name: 'Etudiants' });
</script>

<template>
  <div>
    <PageHeader
      :title="fullName || 'Fiche étudiant'"
      :subtitle="etudiant?.matricule ? `Matricule ${etudiant.matricule}` : ''"
      :breadcrumb="['portail', 'étudiants', 'fiche']"
    >
      <template #actions>
        <button type="button" class="btn btn-outline-secondary me-3 mt-2 mt-xl-0" @click="goBack">
          <i class="mdi mdi-arrow-left me-1"></i> Retour
        </button>

        <button v-if="etudiant" class="btn btn-primary mt-2 mt-xl-0" @click="openEdit(etudiant)">
          <i class="mdi mdi-pencil-outline me-1"></i> Modifier
        </button>
      </template>
    </PageHeader>

    <LoadingSpinner v-if="loading && !etudiant" />

    <EmptyState
      v-else-if="notFound || !etudiant"
      title="Étudiant introuvable"
      description="Cette fiche n'existe pas, ou elle a été supprimée."
    />

    <PageCard v-else>
      <AppTabs :tabs="tabs" />
    </PageCard>

    <EtudiantFormModal />
  </div>
</template>
