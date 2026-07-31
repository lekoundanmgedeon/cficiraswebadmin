<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeClassesTab from './tabs/ListeClassesTab.vue';
import ClassesFiltreesTab from './tabs/ClassesFiltreesTab.vue';
import OrganisationTab from './tabs/OrganisationTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';

/**
 * L'écran des classes affichait aussi les filières et les niveaux, via deux
 * composants qui recopiaient (en divergeant) ceux de l'écran des filières —
 * 375 lignes de duplication. La duplication a d'abord cédé la place aux onglets
 * des sous-domaines eux-mêmes ; ces deux onglets **filtrent désormais les
 * classes** au lieu d'administrer des filières et des niveaux, ce qui reste du
 * ressort de leurs écrans respectifs.
 *
 * Un seul composant sert les deux : ils ne diffèrent que par la dimension du
 * filtre et par leurs libellés.
 */
const tabs = [
  { id: 'classes', label: 'Liste des classes', component: ListeClassesTab },
  {
    id: 'filieres',
    label: 'Par filière',
    component: ClassesFiltreesTab,
    props: { dimension: 'filiere' },
  },
  {
    id: 'niveaux',
    label: 'Par niveau',
    component: ClassesFiltreesTab,
    props: { dimension: 'niveau' },
  },
  { id: 'organisation', label: 'Organisation', component: OrganisationTab },
  { id: 'statistiques', label: 'Statistiques', component: StatistiquesTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
