<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeFilieresTab from './tabs/ListeFilieresTab.vue';
import OrganisationTab from './tabs/OrganisationTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';
import ListeNiveauxTab from '../../niveau/components/ListeNiveauxTab.vue';

/**
 * Les niveaux n'ont pas d'écran propre : ils s'administrent depuis un onglet de
 * l'écran des filières. Le sous-domaine `niveau` reste néanmoins autonome
 * (api, store, composants) ; seul son onglet est monté ici.
 */
const tabs = [
  { id: 'liste', label: 'Liste des filières', component: ListeFilieresTab },
  { id: 'niveaux', label: 'Niveaux', component: ListeNiveauxTab },
  { id: 'organisation', label: 'Organisation', component: OrganisationTab },
  { id: 'statistiques', label: 'Statistiques', component: StatistiquesTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
