<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import FinalistesTab from './tabs/FinalistesTab.vue';
import ProgressionTab from './tabs/ProgressionTab.vue';

/**
 * Deux lectures des mêmes étudiants : la **liste** (qui est finaliste, où en
 * est-il) et la **synthèse** (ce qui bloque). Aucune lecture supplémentaire
 * n'est faite pour la seconde — elle dérive de la première.
 */
const tabs = [
  { id: 'finalistes', label: 'Étudiants finalistes', component: FinalistesTab },
  { id: 'progression', label: 'Progression des travaux', component: ProgressionTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
