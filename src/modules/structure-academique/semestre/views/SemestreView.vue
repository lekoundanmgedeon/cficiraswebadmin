<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import { useSemestreForm } from '../composables/useSemestreForm';
import SemestreTabs from '../components/SemestreTabs.vue';
import SemestreFormModal from '../components/SemestreFormModal.vue';

const { openCreate } = useSemestreForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Gestion des semestres"
      subtitle="Périodes académiques et leur organisation"
      :breadcrumb="['structures', 'semestres']"
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
      <SemestreTabs />
    </PageCard>

    <SemestreFormModal />
  </div>
</template>
