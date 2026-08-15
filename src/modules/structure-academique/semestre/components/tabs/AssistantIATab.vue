<script setup>
// Dépendance entre modules : structure-academique → assistant (déclarée, cf.
// la règle de dépendance d'ARCHITECTURE.md).
import AssistantPanneau from '@/modules/assistant/components/AssistantPanneau.vue';

/**
 * L'assistant IA de la structure académique.
 *
 * Il est placé dans l'écran des semestres parce que c'est le dernier maillon de
 * la chaîne année → cycle → filière → niveau → classe → semestre : les
 * questions transversales (« combien d'étudiants par filière ? », « quelles
 * classes débordent ? ») s'y posent naturellement, alors que les cinq autres
 * écrans administrent chacun un seul référentiel.
 *
 * Les amorces sont choisies pour rester dans ce que la base sait établir. Deux
 * pièges à connaître, et qui expliquent leur formulation :
 *
 *  - le remplissage ne se demande **que** par classe : `v_organisation_filieres`
 *    et `v_organisation_cycles` gonflent les capacités par une jointure (33 790
 *    places annoncées pour 5 400 réelles). Le catalogue de l'assistant le lui
 *    dit désormais, et l'oriente vers `v_organisation_classes` ;
 *  - un semestre n'a pas de niveau, et un cycle n'a pas de nom — inutile de
 *    proposer des questions qui les supposent.
 */

const AMORCES = [
  {
    icone: 'bi-people',
    libelle: 'Effectifs par filière',
    question: "Combien d'étudiants par filière cette année ?",
  },
  {
    icone: 'bi-speedometer2',
    libelle: 'Classes les plus remplies',
    question:
      'Quelles sont les 10 classes au plus fort taux de remplissage ? Donne effectif, capacité et taux.',
  },
  {
    icone: 'bi-diagram-3',
    libelle: 'Répartition par cycle',
    question: 'Combien de filières et de classes par cycle, et quel effectif dans chacun ?',
  },
  {
    icone: 'bi-book',
    libelle: 'Modules par classe',
    question: 'Quelles classes ont le plus de modules, et pour combien de crédits au total ?',
  },
];
</script>

<template>
  <AssistantPanneau
    cadrage="structure-academique"
    titre="Assistant IA — structure académique"
    intro="Interrogez l'organisation de l'établissement : années, cycles, filières, niveaux, classes et semestres."
    perimetre="Effectifs, capacités et remplissage des classes, répartition des filières et des cycles, modules et crédits par classe, semestres de l'année en cours."
    placeholder="Ex. : quelles classes dépassent leur capacité ?"
    :amorces="AMORCES"
  />
</template>
