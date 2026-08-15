<script setup>
// Dépendance entre modules : examens → assistant (déclarée, cf. ARCHITECTURE.md).
import AssistantPanneau from '@/modules/assistant/components/AssistantPanneau.vue';

/**
 * L'assistant IA des rapports d'examens.
 *
 * Le palmarès de l'onglet voisin ne se lit que classe par classe : c'est la
 * forme même de l'endpoint, un bulletin appartenant au triplet (classe,
 * semestre, année). Les questions transversales — comparer deux classes,
 * suivre un taux de réussite par filière, situer une moyenne dans l'ensemble —
 * n'ont donc aucun écran où se poser. C'est ce que cet onglet ouvre.
 *
 * Les résultats agrégés viennent de `vue_statistiques_resultats`, que
 * l'assistant interroge en SQL ; le front, lui, n'a pas d'endpoint pour cela.
 */

const AMORCES = [
  {
    icone: 'mdi-podium',
    libelle: 'Comparer les classes',
    question: 'Compare les classes sur leur moyenne générale et leur taux de réussite ce semestre.',
  },
  {
    icone: 'mdi-school-outline',
    libelle: 'Réussite par filière',
    question: 'Quel est le taux de réussite par filière ? Donne le nombre de bulletins par ligne.',
  },
  {
    icone: 'mdi-medal-outline',
    libelle: 'Mentions décernées',
    question: 'Combien de mentions de chaque niveau ont été décernées, et dans quelles classes ?',
  },
  {
    icone: 'mdi-book-alert-outline',
    libelle: 'Modules les plus échoués',
    question: 'Sur quels modules les moyennes sont-elles les plus basses ?',
  },
];
</script>

<template>
  <AssistantPanneau
    cadrage="examens"
    titre="Assistant IA — résultats d'examens"
    intro="Comparez les résultats au-delà d'une seule classe : moyennes, rangs, mentions et taux de réussite."
    perimetre="Bulletins et statistiques de résultats : moyennes, rangs, mentions, décisions, taux de réussite par classe, semestre ou filière."
    placeholder="Ex. : quelles classes ont la meilleure moyenne ce semestre ?"
    :amorces="AMORCES"
  />
</template>
