<script setup>
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CADRAGES_CONNUS, cadrageInfo } from '../../constants';
import { useEspaceChatStore } from '../store';
import AssistantFil from '../../components/AssistantFil.vue';
import AssistantChamp from '../../components/AssistantChamp.vue';
import BarreFil from '../components/BarreFil.vue';

/**
 * L'écran de conversation de l'espace.
 *
 * Sert deux routes : `/espace-chat` (fil neuf) et `/espace-chat/c/:id` (fil
 * rouvert). Le paramètre est **observé** et non seulement lu au montage —
 * `vue-router` réutilise le composant d'une conversation à l'autre, et sans ce
 * `watch` cliquer dans la liste ne changerait rien à l'écran.
 *
 * ## Ce que cet écran fait que l'assistant embarqué ne fait pas
 *
 * Il rouvre les conversations passées, toutes provenances confondues : celles
 * posées ici, mais aussi celles posées depuis les onglets métier — structure
 * académique, scolarité, examens, finances. L'assistant de la plateforme reste
 * fait pour la question rapide sur l'écran qu'on a sous les yeux ; la
 * conversation longue et sa relecture se passent ici.
 */

const route = useRoute();
const store = useEspaceChatStore();

/**
 * Les amorces de l'écran d'accueil.
 *
 * Choisies pour traverser les quatre domaines — c'est ce qui distingue l'espace
 * des onglets, chacun cantonné au sien. Elles restent dans ce que la base sait
 * établir : le remplissage ne se demande que par classe (les vues par filière
 * et par cycle gonflent les capacités par une jointure).
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
    icone: 'bi-graph-up',
    libelle: 'Réussite par filière',
    question: 'Quel est le taux de réussite par filière au dernier semestre clôturé ?',
  },
  {
    icone: 'bi-exclamation-diamond',
    libelle: 'Impayés',
    question: 'Quelles classes ont le plus d’impayés ? Donne le montant restant à recouvrer.',
  },
];

function synchroniser() {
  const id = route.params.id;

  if (!id) {
    // `?cadrage=finances` : on arrive d'un onglet métier qui n'avait pas encore
    // de fil ouvert. Le domaine est repris pour que la première question s'y
    // comprenne — il oriente la lecture, il n'ouvre aucun droit.
    const demande = route.query.cadrage;
    const cadrage = CADRAGES_CONNUS.includes(demande) ? demande : store.cadrage;

    // Revenir sur `/espace-chat` avec un fil déjà ouvert doit rendre un écran
    // vierge, sinon le bouton « Nouvelle conversation » ne ferait rien de
    // visible quand on est déjà sur cette route.
    if (store.conversationId || cadrage !== store.cadrage) store.nouvelleConversation(cadrage);
    return;
  }

  if (id !== store.conversationId) store.chargerConversation(id);
}

onMounted(synchroniser);
watch(() => route.params.id, synchroniser);
</script>

<template>
  <div class="d-flex flex-column h-100">
    <BarreFil />

    <div v-if="store.utilisable === false" class="alert alert-warning rounded-0 mb-0 py-2 small">
      <i class="bi bi-exclamation-triangle me-1"></i>
      <strong>Assistant indisponible.</strong> {{ store.raisonIndisponible }}
    </div>

    <div
      v-if="store.chargementFil"
      class="flex-grow-1 d-flex align-items-center justify-content-center"
    >
      <span class="spinner-border text-secondary" role="status"></span>
      <span class="visually-hidden">Chargement de la conversation…</span>
    </div>

    <div
      v-else-if="store.estVide"
      class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center px-4"
    >
      <i class="bi bi-robot text-primary" style="font-size: 3rem"></i>
      <h5 class="mt-3 mb-1">Que voulez-vous savoir ?</h5>
      <p class="text-body-secondary small mb-1" style="max-width: 34rem">
        Posez une question sur les étudiants, la scolarité, les résultats, les enseignants — ou les
        finances si votre rôle y donne accès. Les réponses s'appuient sur les données auxquelles
        votre rôle donne accès.
      </p>

      <p v-if="store.cadrage" class="small mb-3">
        <span class="badge" :class="`bg-${cadrageInfo(store.cadrage).couleur}`">
          <i class="bi me-1" :class="cadrageInfo(store.cadrage).icone"></i>
          Cadré sur « {{ cadrageInfo(store.cadrage).libelle }} »
        </span>
      </p>

      <div class="d-flex flex-wrap gap-2 justify-content-center mt-2" style="max-width: 40rem">
        <button
          v-for="amorce in AMORCES"
          :key="amorce.question"
          type="button"
          class="btn btn-light btn-sm text-start border chat-amorce"
          :disabled="store.enCours || store.utilisable === false"
          @click="store.demander(amorce.question)"
        >
          <i class="bi me-2 text-primary" :class="amorce.icone"></i>{{ amorce.libelle }}
        </button>
      </div>
    </div>

    <!-- `min-height: 0` : sans lui, un enfant de conteneur flex refuse de
         rétrécir sous la hauteur de son contenu, le fil pousse le champ de
         saisie hors de l'écran au lieu de défiler. -->
    <div v-else class="flex-grow-1 chat-zone px-3 pt-3">
      <AssistantFil :messages="store.messages" :en-cours="store.enCours" hauteur="100%" />
    </div>

    <div class="chat-composeur px-3 py-2 border-top">
      <AssistantChamp
        :en-cours="store.enCours"
        :desactive="store.utilisable === false"
        :suggestions="[]"
        placeholder="Posez votre question — soyez aussi précis que vous le souhaitez…"
        @demander="store.demander"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-zone {
  min-height: 0;
  overflow: hidden;
}

.chat-composeur {
  background: #fff;
}

.chat-amorce {
  transition: transform 0.15s ease-in-out;
}

.chat-amorce:hover:not(:disabled) {
  transform: translateY(-1px);
}
</style>
