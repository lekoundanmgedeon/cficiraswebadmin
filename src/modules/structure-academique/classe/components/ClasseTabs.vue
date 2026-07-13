<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeClassesTab from './tabs/ListeClassesTab.vue';
import OrganisationTab from './tabs/OrganisationTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';
import ListeFilieresTab from '../../filiere/components/tabs/ListeFilieresTab.vue';
import ListeNiveauxTab from '../../niveau/components/ListeNiveauxTab.vue';

/**
 * L'écran des classes affichait aussi les filières et les niveaux, via deux
 * composants qui recopiaient (en divergeant) ceux de l'écran des filières —
 * 375 lignes de duplication. Le module unique permet de réutiliser directement
 * les onglets des sous-domaines concernés.
 */
const tabs = [
  { id: 'classes', label: 'Liste des classes', component: ListeClassesTab },
  { id: 'filieres', label: 'Filières', component: ListeFilieresTab },
  { id: 'niveaux', label: 'Niveaux', component: ListeNiveauxTab },
  { id: 'organisation', label: 'Organisation', component: OrganisationTab },
  { id: 'statistiques', label: 'Statistiques', component: StatistiquesTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
