<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import TravauxTabs from '../components/TravauxTabs.vue';
import TravailFormModal from '../components/TravailFormModal.vue';
import { useTravailForm } from '../composables/useTravailForm';

const { openCreate } = useTravailForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Thèmes & mémoires"
      subtitle="Attribution des sujets, encadrement et suivi des travaux"
      :breadcrumb="['coordination', 'thèmes & mémoires']"
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
        <button class="btn btn-primary mt-2 mt-xl-0" @click="openCreate()">
          + Attribuer un thème
        </button>
      </template>
    </PageHeader>

    <PageCard>
      <TravauxTabs />
    </PageCard>

    <TravailFormModal />
  </div>
</template>
