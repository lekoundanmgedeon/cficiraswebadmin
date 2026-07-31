<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import SoutenanceTabs from '../components/SoutenanceTabs.vue';
import SoutenanceFormModal from '../components/SoutenanceFormModal.vue';
import { useSoutenanceForm } from '../composables/useSoutenanceForm';

const { openCreate } = useSoutenanceForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Soutenances"
      subtitle="Planification, jurys, procès-verbaux et archives"
      :breadcrumb="['coordination', 'soutenances']"
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
          + Planifier une soutenance
        </button>
      </template>
    </PageHeader>

    <PageCard>
      <SoutenanceTabs />
    </PageCard>

    <SoutenanceFormModal />
  </div>
</template>
