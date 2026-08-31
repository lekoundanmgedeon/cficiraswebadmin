<script setup>
import { watch } from 'vue';
import PageHeader from '@/shared/components/PageHeader.vue';
import PageCard from '@/shared/components/PageCard.vue';
import AppTabs from '@/shared/components/AppTabs.vue';
import DeliberationTab from '../components/tabs/DeliberationTab.vue';
import BulletinsTab from '../components/tabs/BulletinsTab.vue';
import RapportsTab from '../components/tabs/RapportsTab.vue';
import AssistantIATab from '../components/tabs/AssistantIATab.vue';
import { useContexteDeliberation } from '../composables/useContexteDeliberation';

/**
 * Délibération.
 *
 * ## Les quatre onglets d'origine, rebranchés
 *
 * L'écran reprend le découpage de `views/deliberation/` — Délibérations,
 * Bulletins, Rapports, Assistant IA — avec le même enchaînement : on délibère,
 * on édite les relevés, on produit les livrables.
 *
 * Ce découpage était le bon ; c'est la donnée qui ne l'était pas. Les quatre
 * composants servaient tous des `ref([...])` codés en dur — jusqu'à
 * `mockClasses = ref(['Master 1 Info', 'Master 2 Info', 'Licence 3 Management'])` —
 * et `RapportsTab.vue`, le cinquième, était **vide** : son onglet ne rendait
 * rien. Chaque onglet dit en tête ce qu'il servait et ce qu'il sert désormais.
 *
 * ## Un seul contexte pour trois onglets
 *
 * Un bulletin appartient au triplet **(classe, semestre, année)**. Chaque écran
 * d'origine portait sa propre sélection : choisir une promotion dans
 * « Délibérations » ne disait rien à « Bulletins ». Le triplet est désormais
 * partagé (`useContexteDeliberation`), et c'est cette vue — montée une fois,
 * quel que soit l'onglet actif — qui observe ses changements et déclenche le
 * chargement. Un `watch` par onglet ferait trois requêtes pour un même clic.
 *
 * ## L'assistant
 *
 * Il garde la logique des autres écrans : `AssistantPanneau` avec son cadrage,
 * comme dans les rapports d'examens, les rapports financiers et les semestres.
 * Le composant d'origine (`AssistantIAContent.vue`) était une conversation
 * simulée — réponses codées en dur poussées après un `setTimeout`.
 */

const { contexte, charger } = useContexteDeliberation();

// `deep` : le sélecteur remplace l'objet champ par champ, et c'est le triplet
// complet qui décide de la requête.
watch(contexte, charger, { deep: true });

const tabs = [
  { id: 'deliberations', label: 'Délibérations', component: DeliberationTab },
  { id: 'bulletins', label: 'Bulletins', component: BulletinsTab },
  { id: 'rapports', label: 'Rapports', component: RapportsTab },
  { id: 'assistant', label: 'Assistant IA', component: AssistantIATab },
];
</script>

<template>
  <div>
    <PageHeader
      title="Délibérations &amp; Proclamation"
      subtitle="Décisions du jury, bulletins officiels et publication des résultats"
      :breadcrumb="['scolarité', 'résultats']"
    />

    <PageCard>
      <AppTabs :tabs="tabs" />
    </PageCard>
  </div>
</template>
