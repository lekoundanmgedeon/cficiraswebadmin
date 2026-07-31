<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import DemandesEnCoursTab from './tabs/DemandesEnCoursTab.vue';
import HistoriqueTab from './tabs/HistoriqueTab.vue';
import CatalogueDocumentsTab from './tabs/CatalogueDocumentsTab.vue';

/**
 * Les trois entrées du guichet : ce qui **attend**, ce qui est **clos**, et ce
 * qu'on **peut demander**. Les anciens menus `/demande-diplome`,
 * `/edition-diplome` et `/historique-diplome` — trois liens morts dans `main` —
 * tiennent ici en trois onglets d'un même écran, comme le reste de
 * l'application.
 */
const tabs = [
  { id: 'demandes', label: 'Demandes en cours', component: DemandesEnCoursTab },
  { id: 'historique', label: 'Historique', component: HistoriqueTab },
  { id: 'catalogue', label: 'Documents délivrables', component: CatalogueDocumentsTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
