<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import BibliothequeTabs from '../components/BibliothequeTabs.vue';
import OuvrageFormModal from '../components/OuvrageFormModal.vue';
import { useOuvrageForm } from '../composables/useOuvrageForm';

const { openCreate } = useOuvrageForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Bibliothèque"
      subtitle="Fonds documentaire et dépôt des travaux académiques"
      :breadcrumb="['ressources', 'bibliothèque']"
    >
      <template #actions>
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
      <BibliothequeTabs />
    </PageCard>

    <OuvrageFormModal />
  </div>
</template>
