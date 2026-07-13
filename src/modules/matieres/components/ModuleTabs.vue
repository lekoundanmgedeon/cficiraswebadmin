<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeModulesTab from './tabs/ListeModulesTab.vue';
import ConfigurationTab from './tabs/ConfigurationTab.vue';

/**
 * L'ancien écran n'avait pas d'onglets : il montait directement `ModuleList.vue`,
 * et son jumeau `AModuleList.vue` — une copie quasi identique — n'était monté
 * nulle part.
 *
 * Les deux faces du domaine sont distinctes et méritent chacune la leur : le
 * **catalogue** des modules (ce qui existe) et leur **composition pédagogique**
 * (ce qui est rattaché à quelle classe, pour quel semestre).
 */
const tabs = [
  { id: 'liste', label: 'Catalogue des modules', component: ListeModulesTab },
  { id: 'configuration', label: 'Composition pédagogique', component: ConfigurationTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
