<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeInscriptionsTab from './tabs/ListeInscriptionsTab.vue';
import ClassesTab from './tabs/ClassesTab.vue';
import ReinscriptionsTab from './tabs/ReinscriptionsTab.vue';
import PaiementsTab from './tabs/PaiementsTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';

/**
 * Les cinq onglets Bootstrap montaient leurs cinq panneaux d'un coup : ouvrir
 * `/inscriptions` déclenchait `GET /inscriptions`, `GET /inscriptions/finances`
 * et `GET /classes` **avant même** que l'utilisateur ait choisi un onglet.
 * `AppTabs` ne monte que l'onglet actif.
 */
const tabs = [
  { id: 'inscriptions', label: 'Inscriptions', component: ListeInscriptionsTab },
  { id: 'classes', label: 'Capacité des classes', component: ClassesTab },
  { id: 'reinscriptions', label: 'Réinscriptions', component: ReinscriptionsTab },
  { id: 'paiements', label: 'Frais & paiements', component: PaiementsTab },
  { id: 'statistiques', label: 'Rapports & stats', component: StatistiquesTab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
