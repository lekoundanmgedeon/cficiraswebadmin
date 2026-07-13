<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import { useClasseForm } from '../composables/useClasseForm';
import ClasseTabs from '../components/ClasseTabs.vue';
import ClasseFormModal from '../components/ClasseFormModal.vue';

const { openCreate } = useClasseForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Classes et niveaux"
      subtitle="Organisation des classes, filières et niveaux"
      :breadcrumb="['structures', 'classes']"
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
      <ClasseTabs />
    </PageCard>

    <ClasseFormModal />
  </div>
</template>
