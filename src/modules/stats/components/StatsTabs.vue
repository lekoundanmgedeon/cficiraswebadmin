<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import SyntheseTab from './tabs/SyntheseTab.vue';
import ClassesTab from './tabs/ClassesTab.vue';
import PalmaresTab from './tabs/PalmaresTab.vue';

/**
 * Les trois onglets des statistiques de résultats.
 *
 * L'écran d'origine en déclarait cinq — « Vue d'ensemble », « Académiques »,
 * « Finances », « Indicateurs », « Rapports » — pour **quatre panneaux**, dont
 * deux liens pointant sur le même `#purchases` : le cinquième onglet rouvrait le
 * quatrième. Ses cinq composants étaient par ailleurs **byte-identiques** et
 * aucun ne recevait sa prop `rows`, si bien que tous rendaient la même table
 * vide, à en-têtes d'examens.
 *
 * Les onglets « Finances » et « Vue d'ensemble » ne sont pas repris : le
 * tableau de bord les couvre déjà, sur les mêmes endpoints. Cet écran ne garde
 * que ce dont il est seul responsable — les résultats.
 */
const tabs = [
  { id: 'synthese', label: 'Synthèse', component: SyntheseTab },
  { id: 'classes', label: 'Par classe', component: ClassesTab },
  { id: 'palmares', label: 'Palmarès', component: PalmaresTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
