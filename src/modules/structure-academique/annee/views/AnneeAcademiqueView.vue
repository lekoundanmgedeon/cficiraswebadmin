<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import { useAnneeStore } from '../store';
import { useAnneeForm } from '../composables/useAnneeForm';
import AnneeTabs from '../components/AnneeTabs.vue';
import AnneeFormModal from '../components/AnneeFormModal.vue';

/**
 * Écran « Années académiques ».
 *
 * La modale de formulaire est montée ici, au-dessus des onglets : l'en-tête et
 * la liste la pilotent tous deux via `useAnneeForm`, et elle survit donc au
 * changement d'onglet.
 */

const anneeStore = useAnneeStore();
const { openCreate } = useAnneeForm();

/** L'export exige l'identifiant d'une année : on charge l'année courante si besoin. */
async function exportData() {
  if (!anneeStore.current) await anneeStore.fetchCurrent();
  if (anneeStore.current?.id) await anneeStore.exportData(anneeStore.current.id);
}

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Gestion Années Académiques"
      subtitle="Configuration et gestion des années académiques"
      :breadcrumb="['structures', 'années']"
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-light bg-white btn-icon me-3 d-none d-md-block"
          title="Exporter l'année courante"
          :disabled="anneeStore.loading"
          @click="exportData"
        >
          <i class="mdi mdi-download text-muted"></i>
        </button>
        <button
          type="button"
          class="btn btn-light bg-white btn-icon me-3 mt-2 mt-xl-0"
          title="Imprimer"
          @click="print"
        >
          <i class="mdi mdi-printer text-muted"></i>
        </button>
        <button class="btn btn-primary mt-2 mt-xl-0" @click="openCreate">
          + Ajouter un nouveau
        </button>
      </template>
    </PageHeader>

    <PageCard>
      <AnneeTabs />
    </PageCard>

    <AnneeFormModal />
  </div>
</template>
