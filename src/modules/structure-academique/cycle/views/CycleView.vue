<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import { useCycleForm } from '../composables/useCycleForm';
import CycleTabs from '../components/CycleTabs.vue';
import CycleFormModal from '../components/CycleFormModal.vue';

const { openCreate } = useCycleForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Gestion des cycles"
      subtitle="Configuration et gestion des cycles académiques"
      :breadcrumb="['structures', 'cycles']"
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
      <CycleTabs />
    </PageCard>

    <CycleFormModal />
  </div>
</template>
