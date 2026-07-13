<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeCyclesTab from './tabs/ListeCyclesTab.vue';
import ArchitectureTab from './tabs/ArchitectureTab.vue';
import OrganisationTab from './tabs/OrganisationTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';

/**
 * Les quatre onglets appelaient chacun leur endpoint au chargement de la page,
 * soit quatre requêtes pour un seul onglet visible. `AppTabs` ne monte que
 * l'onglet actif.
 */
const tabs = [
  { id: 'liste', label: 'Liste des cycles', component: ListeCyclesTab },
  { id: 'architecture', label: 'Filières par cycle', component: ArchitectureTab },
  { id: 'organisation', label: 'Organisation', component: OrganisationTab },
  { id: 'statistiques', label: 'Statistiques', component: StatistiquesTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
