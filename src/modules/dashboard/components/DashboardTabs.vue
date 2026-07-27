<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import VueEnsembleTab from './tabs/VueEnsembleTab.vue';
import ScolaritesTab from './tabs/ScolaritesTab.vue';
import PedagogiesTab from './tabs/PedagogiesTab.vue';
import CyclesTab from './tabs/CyclesTab.vue';
import RapportsTab from './tabs/RapportsTab.vue';

/**
 * Les cinq onglets du tableau de bord.
 *
 * Ils étaient rendus par un conteneur Bootstrap (`data-bs-toggle="tab"`), qui
 * monte **tous** les panneaux d'un coup : les cinq `onMounted` — et donc les
 * cinq séries de requêtes, plus cinq instances Chart.js — s'exécutaient au
 * chargement de la page d'accueil pour n'en afficher qu'un. `AppTabs` ne monte
 * que l'onglet actif et conserve les suivants via `KeepAlive` (§1.13).
 */
defineProps({
  /** Onglet ouvert au premier rendu. */
  defaultTab: { type: String, default: null },
});

const tabs = [
  { id: 'overview', label: "Vue d'ensemble", component: VueEnsembleTab },
  { id: 'scolarites', label: 'Scolarités', component: ScolaritesTab },
  { id: 'pedagogies', label: 'Pédagogies', component: PedagogiesTab },
  { id: 'cycles', label: 'Cycles', component: CyclesTab },
  { id: 'rapports', label: 'Rapports', component: RapportsTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" :default-tab="defaultTab" />
</template>
