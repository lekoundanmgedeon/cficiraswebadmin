<script setup>
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import AppTabs from '@/shared/components/AppTabs.vue';
import DeliberationTab from '../components/tabs/DeliberationTab.vue';
import AssistantIATab from '../components/tabs/AssistantIATab.vue';

/**
 * Délibération.
 *
 * L'écran s'est ouvert en onglets pour accueillir l'assistant IA. Le
 * procès-verbal — sélection du triplet (classe, semestre, année), palmarès,
 * décisions du jury, publication — occupe le premier ; il porte ses propres
 * actions d'export et de publication, qui n'ont pas de sens sur le second.
 *
 * Un onglet « Assistant IA » existait déjà ici avant la refonte, mais
 * entièrement simulé (`AssistantIAContent.vue` : réponses codées en dur,
 * `setTimeout`). Il avait été retiré faute de backend. Celui-ci existe
 * désormais — `POST /api/assistant/question` —, l'onglet revient donc, branché
 * pour de bon.
 */
const tabs = [
  { id: 'deliberation', label: 'Procès-verbal', component: DeliberationTab },
  { id: 'assistant', label: 'Assistant IA', component: AssistantIATab },
];
</script>

<template>
  <div>
    <PageHeader
      title="Délibération"
      subtitle="Bulletins, décisions du jury et publication des résultats"
      :breadcrumb="['évaluations', 'délibération']"
    />

    <PageCard>
      <AppTabs :tabs="tabs" />
    </PageCard>
  </div>
</template>
