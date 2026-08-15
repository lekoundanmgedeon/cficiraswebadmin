<script setup>
import { computed } from 'vue';
import PageCard from '@/shared/components/PageCard.vue';
import AppTabs from '@/shared/components/AppTabs.vue';
import ExamenHeader from '../../components/ExamenHeader.vue';
import PalmaresTab from '../components/tabs/PalmaresTab.vue';
import AssistantIATab from '../components/tabs/AssistantIATab.vue';
import { useBulletinStore } from '../store';

/**
 * Rapports d'examens : le palmarès d'une classe, et l'assistant IA.
 *
 * L'écran s'est ouvert en onglets pour accueillir le second : le palmarès ne se
 * lit que classe par classe — un bulletin appartient au triplet (classe,
 * semestre, année) —, et aucune vue n'offrait de comparer les classes entre
 * elles. L'assistant, lui, interroge les résultats agrégés.
 */

const bulletinStore = useBulletinStore();

const tabs = [
  { id: 'palmares', label: 'Palmarès', component: PalmaresTab },
  { id: 'assistant', label: 'Assistant IA', component: AssistantIATab },
];

/**
 * « Actualiser » recharge le triplet consulté — celui que le store retient.
 * Tant qu'aucun n'a été choisi, il n'y a rien à recharger et le bouton ne
 * s'affiche pas : l'en-tête du module n'en montre un que si une action lui est
 * fournie.
 */
const refresh = computed(() => (bulletinStore.contexte ? () => bulletinStore.refresh() : null));
</script>

<template>
  <div>
    <ExamenHeader
      title="Rapports & résultats"
      subtitle="Palmarès et publication des bulletins, par classe."
      breadcrumb="Rapports"
      :refresh="refresh"
    />

    <PageCard>
      <AppTabs :tabs="tabs" />
    </PageCard>
  </div>
</template>
