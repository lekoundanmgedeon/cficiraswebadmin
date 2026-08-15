<script setup>
import { onMounted } from 'vue';
import PageHeader from '@/shared/components/PageHeader.vue';
import { useAuthStore } from '@/core/auth/authStore';
import { useAssistantStore } from '../store';
import AssistantFil from '../components/AssistantFil.vue';
import AssistantChamp from '../components/AssistantChamp.vue';

/**
 * Assistant IA.
 *
 * Remplace l'écran factice qui poussait, après un `setTimeout(1500)`, une seule
 * réponse markdown codée en dur — la même pour toute question. Les trois
 * prérequis que cet écran déclarait manquants existent désormais :
 *
 *  - un service d'inférence : `POST /api/assistant/question` ;
 *  - un accès en lecture aux données citées : catalogue filtré par rôle, SQL
 *    sous garde-fous, transaction en lecture seule ;
 *  - une trace des échanges : table `assistant_echanges`.
 *
 * Le fil affiché est celui de la session. Les conversations antérieures sont
 * listées mais **ne se rouvrent pas** : leurs chiffres seraient périmés, et
 * afficher un effectif d'hier comme s'il valait aujourd'hui serait pire que de
 * reposer la question.
 */
const store = useAssistantStore();
const auth = useAuthStore();

onMounted(() => {
  // Seul appel bon marché : il dit si le module est utilisable avant que
  // l'utilisateur ait tapé quoi que ce soit. Les questions, elles, coûtent
  // plusieurs secondes et ne sont jamais lancées au montage.
  store.fetchSante();
  store.fetchConversations();
  // Le rôle décide de l'affichage du SQL sous chaque réponse ; un
  // rechargement de page vide le profil en mémoire (voir `AssistantRequetes`).
  auth.fetchCurrentUser();
});
</script>

<template>
  <div>
    <PageHeader
      title="Assistant IA"
      subtitle="Interrogation en langage naturel des données de l'établissement"
      :breadcrumb="['Plateforme', 'Assistant']"
    />

    <div v-if="store.utilisable === false" class="alert alert-warning" role="alert">
      <i class="mdi mdi-alert-outline me-1"></i>
      <strong>Assistant indisponible.</strong>
      {{ store.raisonIndisponible }}
    </div>

    <div class="row">
      <div class="col-lg-9 grid-margin stretch-card">
        <div class="card">
          <div class="card-body d-flex flex-column">
            <div v-if="store.estVide" class="text-center text-muted py-5 flex-grow-1">
              <i class="mdi mdi-robot-outline" style="font-size: 2.5rem"></i>
              <p class="mt-2 mb-0">
                Posez une question sur les étudiants, la scolarité, les résultats, les enseignants —
                ou les finances si votre rôle y donne accès.
              </p>
            </div>

            <AssistantFil v-else :messages="store.messages" :en-cours="store.enCours" />

            <div class="mt-3">
              <AssistantChamp
                :en-cours="store.enCours"
                :desactive="store.utilisable === false"
                @demander="store.demander"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 grid-margin">
        <div class="card mb-3">
          <div class="card-body">
            <button
              type="button"
              class="btn btn-outline-primary btn-sm w-100 mb-3"
              :disabled="store.estVide"
              @click="store.nouvelleConversation"
            >
              <i class="mdi mdi-plus me-1"></i> Nouvelle conversation
            </button>

            <h6 class="card-title mb-2">Conversations</h6>

            <p v-if="!store.conversations.length" class="small text-muted mb-0">
              Aucune conversation enregistrée.
            </p>

            <ul v-else class="list-unstyled mb-0">
              <li
                v-for="fil in store.conversations"
                :key="fil.conversation_id"
                class="border-bottom py-2 small"
              >
                <div class="text-truncate" :title="fil.titre">{{ fil.titre }}</div>
                <div class="text-muted" style="font-size: 0.75rem">
                  {{ fil.nb_echanges }} échange{{ fil.nb_echanges > 1 ? 's' : '' }}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div v-if="store.sante?.sources" class="card">
          <div class="card-body">
            <h6 class="card-title mb-2">Sources accessibles</h6>
            <p class="small text-muted mb-1">
              {{ store.sante.sources.nbVues }} vues, selon votre rôle.
            </p>
            <span
              v-for="domaine in store.sante.sources.domaines"
              :key="domaine"
              class="badge bg-light text-dark me-1 mb-1"
            >
              {{ domaine }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
