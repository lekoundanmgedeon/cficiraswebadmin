<script setup>
// Dépendance entre modules : notes → assistant (déclarée, cf. ARCHITECTURE.md).
import AssistantPanneau from '@/modules/assistant/components/AssistantPanneau.vue';

/**
 * L'assistant IA de la scolarité, dans l'écran de délibération.
 *
 * Il remplace `AssistantIAContent.vue`, une conversation entièrement simulée :
 * les réponses étaient codées en dur et poussées après un `setTimeout`, les
 * mêmes quelle que soit la base.
 *
 * Il répond ici sur les étudiants et leur scolarité — dossiers, inscriptions,
 * parcours, notes, moyennes, mentions et décisions de jury —, c'est-à-dire sur
 * ce qui précède et ce qui suit la délibération que cet écran administre.
 *
 * ⚠️ Les amorces évitent tout ce qui touche à l'assiduité : **aucune route ni
 * aucune vue d'absence n'existe** dans ce système. Un assistant à qui l'on
 * demande un taux de présence répondrait qu'il n'a pas la donnée — autant ne
 * pas l'y inviter.
 */

const AMORCES = [
  {
    icone: 'bi-trophy',
    libelle: 'Taux de réussite par classe',
    question:
      'Quel est le taux de réussite par classe ce semestre ? Donne le nombre de bulletins et le nombre de validés.',
  },
  {
    icone: 'bi-bar-chart-line',
    libelle: 'Répartition des mentions',
    question: 'Comment se répartissent les mentions sur les bulletins de cette année ?',
  },
  {
    icone: 'bi-exclamation-triangle',
    libelle: 'Étudiants en difficulté',
    question: 'Quels étudiants ont une moyenne générale inférieure à 10 ? Donne classe et moyenne.',
  },
  {
    icone: 'bi-people',
    libelle: 'Effectifs et statuts',
    question:
      'Combien d’étudiants par classe cette année, et combien d’inscriptions par statut (ACTIVE, VALIDEE, EN_ATTENTE…) ?',
  },
];
</script>

<template>
  <AssistantPanneau
    cadrage="scolarite"
    titre="Assistant IA — scolarité et délibération"
    intro="Interrogez les dossiers étudiants, les inscriptions, les notes et les décisions de jury."
    perimetre="Parcours et dossiers des étudiants, inscriptions et statuts, notes, moyennes, crédits, mentions et décisions de jury. Aucune donnée d'assiduité n'existe dans ce système."
    placeholder="Ex. : quels étudiants n'ont pas validé leur semestre ?"
    :amorces="AMORCES"
  />
</template>
