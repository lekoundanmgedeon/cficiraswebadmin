<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeSemestresTab from './tabs/ListeSemestresTab.vue';
import OrganisationTab from './tabs/OrganisationTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';
import ListeNiveauxTab from '../../niveau/components/ListeNiveauxTab.vue';

/**
 * L'onglet « Niveaux » de cet écran était un troisième exemplaire du même
 * tableau (401 lignes), après ceux des filières et des classes. Il réutilise
 * désormais le composant du sous-domaine `niveau`.
 */
const tabs = [
  { id: 'semestres', label: 'Liste des semestres', component: ListeSemestresTab },
  { id: 'niveaux', label: 'Niveaux', component: ListeNiveauxTab },
  { id: 'organisation', label: 'Organisation', component: OrganisationTab },
  { id: 'statistiques', label: 'Statistiques', component: StatistiquesTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
