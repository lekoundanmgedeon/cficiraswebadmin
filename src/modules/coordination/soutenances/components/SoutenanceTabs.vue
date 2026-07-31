<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import PlanningTab from './tabs/PlanningTab.vue';
import ProcesVerbauxTab from './tabs/ProcesVerbauxTab.vue';
import DossiersTab from './tabs/DossiersTab.vue';

/**
 * Les trois temps d'une soutenance : on la **planifie**, on l'**acte** par un
 * procès-verbal, puis le dossier rejoint les **archives**. Un onglet par temps,
 * parce qu'on n'y revient ni au même moment ni pour la même raison.
 */
const tabs = [
  { id: 'planning', label: 'Planning', component: PlanningTab },
  { id: 'pv', label: 'Procès-verbaux', component: ProcesVerbauxTab },
  { id: 'dossiers', label: 'Dossiers & archives', component: DossiersTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
