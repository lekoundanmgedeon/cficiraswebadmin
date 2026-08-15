<script setup>
// Dépendance entre modules : finances → assistant (déclarée, cf. ARCHITECTURE.md).
import AssistantPanneau from '@/modules/assistant/components/AssistantPanneau.vue';

/**
 * L'assistant IA des rapports financiers.
 *
 * ## Ce que cet onglet était
 *
 * Une conversation simulée. Quatre réponses codées en dur, choisies par
 * recherche de mot-clé dans la question puis poussées après un
 * `setTimeout(1200)` : « trésorerie » rendait toujours les mêmes 8 450 000 FCFA
 * de prévision et le même solde de +5 650 000, « classe » le même trio de
 * promotions débitrices — sur n'importe quelle base, y compris vide. Aucun
 * appel réseau n'était émis.
 *
 * Sa disposition, elle, était juste : c'est celle qu'a reprise
 * `AssistantPanneau`, et que servent maintenant les quatre onglets.
 *
 * ## Ce qu'il est
 *
 * `POST /api/assistant/question`, cadré sur les finances. Le cadrage oriente la
 * lecture ; il ne donne aucun droit : les vues financières restent réservées
 * aux rôles qui y ont accès (FINANCES, COMPTABLE, DIRECTEUR, ADMIN), et un
 * rôle pédagogique posant la question ici obtiendra que la donnée ne lui est
 * pas accessible.
 *
 * Les amorces ne promettent plus de prévision ni de simulation : rien dans les
 * données ne permet d'établir un encaissement futur, et l'assistant n'invente
 * pas. Elles portent sur ce que la base sait dire — encaissé, impayés,
 * échéances dépassées, bilan par filière.
 */

const AMORCES = [
  {
    icone: 'mdi-cash-multiple',
    libelle: 'Encaissements de la période',
    question: 'Combien a-t-on encaissé ce mois-ci, et par mode de paiement ?',
  },
  {
    icone: 'mdi-alert-octagon-outline',
    libelle: 'Classes les plus débitrices',
    question:
      'Quelles classes ont le plus d’impayés ? Donne le montant restant dû et le nombre d’étudiants concernés.',
  },
  {
    icone: 'mdi-calendar-alert',
    libelle: 'Échéances dépassées',
    question: 'Quelles échéances sont dépassées et non soldées, pour quel montant total ?',
  },
  {
    icone: 'mdi-chart-box-outline',
    libelle: 'Bilan par filière',
    question: 'Quel est le bilan financier par filière : attendu, encaissé, reste à recouvrer ?',
  },
];
</script>

<template>
  <AssistantPanneau
    cadrage="finances"
    titre="Assistant IA — finances"
    intro="Interrogez les encaissements, les factures, les échéances et le recouvrement."
    perimetre="Paiements, factures, échéances, situation financière des étudiants et bilans par filière. Montants en FCFA, tels que la base les enregistre — aucune projection."
    placeholder="Ex. : quel est le reste à recouvrer sur l'année en cours ?"
    :amorces="AMORCES"
  />
</template>
