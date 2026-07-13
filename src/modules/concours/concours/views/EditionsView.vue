<script setup>
import { markRaw } from 'vue';
import AppTabs from '@/shared/components/AppTabs.vue';
import PageHeader from '@/shared/components/PageHeader.vue';
import ListeConcoursTab from '../components/ListeConcoursTab.vue';
import ResultatsTab from '../components/ResultatsTab.vue';
import ConcoursFormModal from '../components/ConcoursFormModal.vue';
import { useConcoursForm } from '../composables/useConcoursForm';

/**
 * Gestion des concours.
 *
 * `ConcoursTab.vue` déclarait **trois onglets pour quatre panneaux** : le
 * quatrième rendait `<StatistiquesContent />`, **un composant jamais importé** —
 * Vue échouait à le résoudre. Aucun lien de navigation n'y menait de toute façon.
 *
 * L'onglet « Historique » a été retiré : `HistoriqueContent.vue` servait un
 * `logs = ref([])` simulé, la table `historique_concours` est **vide** et
 * **aucune route ne l'expose**. Voir §2.5 du point de reprise.
 *
 * Le conteneur d'onglets Bootstrap montait par ailleurs tous ses panneaux d'un
 * coup ; `AppTabs` ne monte que l'onglet actif.
 */

const { openCreate } = useConcoursForm();

const tabs = [
  { id: 'concours', label: 'Concours', component: markRaw(ListeConcoursTab) },
  { id: 'resultats', label: 'Résultats', component: markRaw(ResultatsTab) },
];

const print = () => window.print();
</script>

<template>
  <div>
    <PageHeader
      title="Gestion de concours"
      subtitle="Organisation, suivi et administration des concours académiques"
      :breadcrumb="['concours', 'gestion']"
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

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body dashboard-tabs p-0">
            <AppTabs :tabs="tabs" />
          </div>
        </div>
      </div>
    </div>

    <ConcoursFormModal />
  </div>
</template>
