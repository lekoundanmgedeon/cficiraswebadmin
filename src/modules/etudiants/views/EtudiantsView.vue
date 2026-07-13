<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import { useEtudiantForm } from '../composables/useEtudiantForm';
import EtudiantTabs from '../components/EtudiantTabs.vue';
import EtudiantFormModal from '../components/EtudiantFormModal.vue';

/**
 * L'en-tête portait un bouton « Générer un rapport » ouvrant une modale qui
 * attendait 1,8 seconde (`setTimeout`) puis notifiait « Rapport généré et
 * téléchargé avec succès » — sans appeler la moindre API ni produire le moindre
 * fichier. L'onglet « Exportations » fait désormais réellement ce que cette
 * modale prétendait faire (filtrage puis export Excel / PDF / CSV des données du
 * serveur), le bouton n'a donc plus lieu d'être.
 */

const { openCreate } = useEtudiantForm();

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Gestion des étudiants"
      subtitle="Suivi, organisation et gestion des étudiants"
      :breadcrumb="['portail', 'étudiants']"
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
          + Ajouter un étudiant
        </button>
      </template>
    </PageHeader>

    <PageCard>
      <EtudiantTabs />
    </PageCard>

    <EtudiantFormModal />
  </div>
</template>
