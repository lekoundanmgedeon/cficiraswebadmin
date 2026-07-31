<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import StatutTabs from '../components/StatutTabs.vue';
import TravailFormModal from '../../travaux/components/TravailFormModal.vue';

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Statut étudiant"
      subtitle="Finalistes de l'année et avancement de leurs travaux de recherche"
      :breadcrumb="['coordination', 'statut étudiant']"
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
      </template>
    </PageHeader>

    <PageCard>
      <StatutTabs />
    </PageCard>

    <!-- L'attribution d'un thème se fait depuis la liste des finalistes : la
         modale du module « thèmes & mémoires » est montée ici pour cela. -->
    <TravailFormModal />
  </div>
</template>
