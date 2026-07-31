<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import CatalogueTab from './tabs/CatalogueTab.vue';
import MemoiresTab from './tabs/MemoiresTab.vue';

/**
 * Deux onglets, deux natures de documents : ce que la bibliothèque **acquiert**
 * (le catalogue) et ce que l'établissement **produit** (les mémoires et thèses
 * soutenus). Les réunir dans une seule liste confondrait un livre acheté et un
 * travail d'étudiant, qui n'ont ni la même origine ni le même cycle de vie.
 */
const tabs = [
  { id: 'catalogue', label: 'Ouvrages disponibles', component: CatalogueTab },
  { id: 'memoires', label: 'Mémoires & thèses', component: MemoiresTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
