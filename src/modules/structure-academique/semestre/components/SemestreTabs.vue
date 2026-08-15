<script setup>
import AppTabs from '@/shared/components/AppTabs.vue';
import ListeSemestresTab from './tabs/ListeSemestresTab.vue';
import UesSemestreTab from './tabs/UesSemestreTab.vue';
import OrganisationTab from './tabs/OrganisationTab.vue';
import StatistiquesTab from './tabs/StatistiquesTab.vue';
import AssistantIATab from './tabs/AssistantIATab.vue';

/**
 * L'onglet « Niveaux » de cet écran était un troisième exemplaire du même
 * tableau (401 lignes), après ceux des filières et des classes ; réduit au
 * composant du sous-domaine `niveau`, il n'en restait pas moins hors sujet —
 * **un semestre n'a pas de niveau** : la table `semestre` ne porte qu'un code,
 * une année et deux dates. Les niveaux s'administrent depuis l'écran des
 * filières.
 *
 * Il cède la place aux unités d'enseignement, qui, elles, sont bien portées par
 * un semestre (`ModuleClasse` : module × classe × semestre).
 *
 * L'onglet « Assistant IA » vient en dernier : il répond sur **toute** la
 * structure académique, pas sur les seuls semestres, et c'est ici qu'aboutit la
 * chaîne année → cycle → filière → niveau → classe → semestre.
 */
const tabs = [
  { id: 'semestres', label: 'Liste des semestres', component: ListeSemestresTab },
  { id: 'ue', label: "Unités d'enseignement", component: UesSemestreTab },
  { id: 'organisation', label: 'Organisation', component: OrganisationTab },
  { id: 'statistiques', label: 'Statistiques', component: StatistiquesTab },
  { id: 'assistant', label: 'Assistant IA', component: AssistantIATab },
];
</script>

<template>
  <AppTabs :tabs="tabs" />
</template>
