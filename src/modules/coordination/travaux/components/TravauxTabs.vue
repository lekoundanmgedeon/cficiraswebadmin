<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import AttributionsTab from './tabs/AttributionsTab.vue';
import SuiviTab from './tabs/SuiviTab.vue';

/**
 * Deux onglets, deux moments : on **attribue** un sujet une fois, on **suit**
 * son avancement toute l'année. Les mêmes données, mais pas le même geste ni la
 * même fréquence — d'où deux écrans plutôt qu'un formulaire unique.
 */
const tabs = [
  { id: 'attributions', label: 'Attribution des thèmes', component: AttributionsTab },
  { id: 'suivi', label: 'Suivi & échéances', component: SuiviTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
