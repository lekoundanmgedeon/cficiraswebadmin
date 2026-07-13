<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import { useFiliereForm } from '../composables/useFiliereForm';
import FiliereTabs from '../components/FiliereTabs.vue';
import FiliereFormModal from '../components/FiliereFormModal.vue';

const { openCreate } = useFiliereForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Gestion des filières"
      subtitle="Configuration des filières et de leurs niveaux"
      :breadcrumb="['structures', 'filières']"
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
      <FiliereTabs />
    </PageCard>

    <FiliereFormModal />
  </div>
</template>
