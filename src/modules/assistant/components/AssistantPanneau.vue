<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/core/auth/authStore';
import { useAssistantStore } from '../store';
import AssistantFil from './AssistantFil.vue';
import AssistantChamp from './AssistantChamp.vue';

/**
 * L'assistant IA sous forme d'onglet, pour un écran donné.
 *
 * Un seul composant sert les quatre onglets — structure académique,
 * délibération, rapports d'examens, rapports financiers. Ils ne diffèrent que
 * par leur `cadrage`, leurs amorces et leur texte de présentation : les
 * dupliquer aurait reproduit ce que ce dépôt passe son temps à défaire.
 *
 * ## Ce qui est branché, et sur quoi
 *
 * Sur `POST /api/assistant/question` — pas sur un `setTimeout`. L'onglet
 * « Assistant IA » des rapports financiers, lui, servait quatre réponses codées
 * en dur, choisies par recherche de mot-clé dans la question : « trésorerie »
 * rendait toujours les mêmes 8 450 000 FCFA, quelle que soit la base.
 *
 * ## La disposition
 *
 * Colonne des amorces à gauche, conversation à droite : reprise de cet onglet
 * financier, la seule maquette validée pour cet usage dans le projet.
 *
 * Aucun appel au montage hormis `/sante`, qui est bon marché : une question
 * mobilise un modèle et plusieurs requêtes SQL, elle ne part que sur une action
 * explicite.
 */

const props = defineProps({
  /**
   * L'écran d'où partent les questions : `structure-academique`, `scolarite`,
   * `examens` ou `finances`. Le serveur refuse toute autre valeur en 400 — ce
   * n'est pas un texte libre.
   */
  cadrage: { type: String, required: true },

  titre: { type: String, required: true },

  /** Une phrase : ce que cet assistant-ci sait faire. */
  intro: { type: String, required: true },

  /**
   * Les amorces de la colonne de gauche.
   * @type {import('vue').PropType<Array<{icone: string, libelle: string, question: string}>>}
   */
  amorces: { type: Array, default: () => [] },

  /** Ce sur quoi l'assistant est branché, dit à l'utilisateur. */
  perimetre: { type: String, default: '' },

  placeholder: { type: String, default: 'Posez votre question en français…' },
});

const store = useAssistantStore(props.cadrage);
const auth = useAuthStore();

onMounted(() => {
  // Seul appel bon marché du module : il dit si l'assistant est utilisable
  // avant que l'utilisateur ait tapé quoi que ce soit.
  if (store.sante === null) store.fetchSante();

  // Le profil décide si le détail des requêtes SQL s'affiche
  // (`AssistantRequetes`, réservé à ADMIN). La connexion le renseigne, mais un
  // rechargement de page le perd : sans cet appel — mis en cache cinq minutes
  // par le store —, un administrateur revenu par F5 ne verrait plus ses
  // requêtes.
  auth.fetchCurrentUser();
});

/** @param {string} question */
function demander(question) {
  if (store.enCours || store.utilisable === false) return;
  store.demander(question);
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start flex-wrap mb-3">
      <div>
        <h5 class="fw-bold mb-1">{{ titre }}</h5>
        <p class="text-muted small mb-0">
          <i class="mdi mdi-robot-outline text-primary me-1"></i>{{ intro }}
        </p>
      </div>

      <button
        type="button"
        class="btn btn-outline-secondary btn-sm mt-2 mt-md-0"
        :disabled="store.estVide || store.enCours"
        @click="store.nouvelleConversation"
      >
        <i class="mdi mdi-plus me-1"></i> Nouvelle conversation
      </button>
    </div>

    <div v-if="store.utilisable === false" class="alert alert-warning py-2 small" role="alert">
      <i class="mdi mdi-alert-outline me-1"></i>
      <strong>Assistant indisponible.</strong> {{ store.raisonIndisponible }}
    </div>

    <!-- Trois colonnes pour les amorces, neuf pour la conversation : à quatre
         et huit, un tableau de quatre colonnes sortait comprimé — c'est la
         réponse qui a besoin de place, pas la liste d'amorces. -->
    <div class="row g-3">
      <div v-if="amorces.length" class="col-lg-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="text-uppercase text-secondary fw-bold small mb-3">
              <i class="mdi mdi-lightning-bolt text-warning me-1"></i> Questions fréquentes
            </h6>

            <div class="d-grid gap-2">
              <button
                v-for="amorce in amorces"
                :key="amorce.question"
                type="button"
                class="btn btn-light btn-sm text-start border-0 text-secondary assistant-amorce"
                :disabled="store.enCours || store.utilisable === false"
                @click="demander(amorce.question)"
              >
                <i class="mdi me-2 text-primary" :class="amorce.icone"></i>{{ amorce.libelle }}
              </button>
            </div>

            <p v-if="perimetre" class="assistant-perimetre mt-4 mb-0 p-3 rounded text-muted">
              <span class="fw-bold text-primary d-block mb-1">
                <i class="mdi mdi-shield-check me-1"></i>Sur quoi il répond
              </span>
              {{ perimetre }}
            </p>
          </div>
        </div>
      </div>

      <div :class="amorces.length ? 'col-lg-9' : 'col-12'">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <div v-if="store.estVide" class="text-center text-muted flex-grow-1 py-5">
              <i class="mdi mdi-robot-outline" style="font-size: 2.2rem"></i>
              <p class="mt-2 mb-0 small">{{ intro }}</p>
              <p class="mb-0 small text-body-secondary">
                Les réponses s'appuient sur les données auxquelles votre rôle donne accès.
              </p>
            </div>

            <!-- 42vh laissait un tableau de quinze lignes défiler dans une
                 fenêtre de trois : la hauteur suit la taille des réponses. -->
            <AssistantFil
              v-else
              :messages="store.messages"
              :en-cours="store.enCours"
              hauteur="58vh"
            />

            <div class="mt-3">
              <AssistantChamp
                :en-cours="store.enCours"
                :desactive="store.utilisable === false"
                :suggestions="[]"
                :placeholder="placeholder"
                @demander="demander"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Le déplacement au survol distingue une amorce cliquable d'une simple étiquette. */
.assistant-amorce {
  transition:
    transform 0.15s ease-in-out,
    background-color 0.15s ease-in-out;
}

.assistant-amorce:hover:not(:disabled) {
  background-color: #f0f2f5;
  color: #212529 !important;
  transform: translateX(3px);
}

.assistant-perimetre {
  background-color: rgba(101, 113, 255, 0.08);
  font-size: 0.78rem;
}
</style>
