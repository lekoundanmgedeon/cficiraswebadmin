<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import DocumentsTabs from '../components/DocumentsTabs.vue';
import DemandeFormModal from '../components/DemandeFormModal.vue';
import { useDemandeForm } from '../composables/useDemandeForm';

const { openCreate } = useDemandeForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Diplômes & documents"
      subtitle="Attestations, certificats, relevés et diplômes — dépôt, traitement et délivrance"
      :breadcrumb="['scolarité', 'diplômes & documents']"
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
          + Nouvelle demande
        </button>
      </template>
    </PageHeader>

    <PageCard>
      <DocumentsTabs />
    </PageCard>

    <DemandeFormModal />
  </div>
</template>
