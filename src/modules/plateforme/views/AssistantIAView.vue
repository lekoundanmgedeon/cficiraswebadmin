<template>
  <div>
    <EnteteEcran
      titre="Assistant IA"
      sous-titre="Interrogation en langage naturel des données de l'établissement"
      fil="Plateforme"
      courant="Assistant"
    />

    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <EcranSansBackend
          titre="Aucun assistant n'est raccordé"
          description="Cet écran dialoguait avec un assistant qui n'existe pas : il répondait toujours le même texte, quelle que soit la question posée."
          :attendus="ATTENDUS"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import EnteteEcran from '../components/EnteteEcran.vue';
import EcranSansBackend from '../components/EcranSansBackend.vue';

/**
 * Assistant IA.
 *
 * L'écran d'origine (416 lignes) était une conversation complète — historique,
 * raccourcis, export, indicateur de frappe — au-dessus d'un `setTimeout(1500)`
 * qui poussait **une seule réponse markdown codée en dur** :
 *
 * > « Les revenus ont augmenté de 15 % […] Relancer les 42 étudiants de
 * > Licence 1 en retard de paiement. »
 *
 * Le même texte pour « Quel est le bénéfice net ? » que pour n'importe quelle
 * autre question. Vérifié dans les deux dépôts : **aucune route d'IA, aucune
 * dépendance** (ni OpenAI, ni Anthropic, ni autre) côté serveur comme côté
 * client.
 *
 * À ne pas confondre avec les champs `llm_summary` que le backend ajoute à ses
 * réponses : ce sont des phrases construites par concaténation dans
 * `utils/response.js`, destinées à rendre les charges utiles lisibles par un
 * futur assistant. Ce n'est pas un service d'IA, c'est un formateur de chaînes.
 *
 * C'est le troisième écran d'assistant factice du projet, après l'onglet
 * « Assistant IA » de la délibération (§1.11) et le panneau « Flash Diagnostics
 * IA » du tableau de bord (§1.18).
 */
const ATTENDUS = [
  "Un service d'inférence (endpoint de conversation) exposé par le backend",
  'Un accès en lecture aux données que les réponses prétendent citer',
  "Une trace des échanges, si l'historique doit survivre au rechargement",
];
</script>
