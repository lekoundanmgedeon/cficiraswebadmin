<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeAnneesTab from './tabs/ListeAnneesTab.vue';
import CalendrierTab from './tabs/CalendrierTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';
import HistoriqueTab from './tabs/HistoriqueTab.vue';

/**
 * Onglets du module. Le montage paresseux est assuré par `AppTabs` : seul
 * l'onglet ouvert déclenche ses appels API.
 */
const tabs = [
  { id: 'liste', label: 'Liste des années', component: ListeAnneesTab },
  { id: 'calendrier', label: 'Calendrier académique', component: CalendrierTab },
  { id: 'statistiques', label: 'Statistiques', component: StatistiquesTab },
  { id: 'historique', label: 'Historique', component: HistoriqueTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
