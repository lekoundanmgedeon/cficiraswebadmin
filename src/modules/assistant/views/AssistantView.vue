<script setup>
import { onMounted } from 'vue';
import PageHeader from '@/shared/components/PageHeader.vue';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useAuthStore } from '@/core/auth/authStore';
import { useAssistantStore } from '../store';
import { ESPACE_CHAT_BASE, cheminConversation, ouvrirEspaceChat } from '../constants';
import AssistantFil from '../components/AssistantFil.vue';
import AssistantChamp from '../components/AssistantChamp.vue';
import AssistantApercus from '../components/AssistantApercus.vue';
import AssistantSources from '../components/AssistantSources.vue';

/**
 * Assistant IA — l'écran de la plateforme.
 *
 * ## Ce qu'il sert, depuis le partage des rôles
 *
 * La **question rapide** et l'**aperçu** : on arrive, on demande un chiffre, on
 * repart. La conversation suivie, la relecture de l'historique, la sauvegarde
 * et l'audit se passent dans l'espace de chat, qui s'ouvre dans son propre
 * onglet. Cet écran-ci n'a donc ni liste de fils ni mémoire : son fil est celui
 * de la session.
 *
 * ## La refonte : deux états, pas deux écrans
 *
 * - **À l'arrivée** — une barre d'appel centrée, et sous elle les aperçus
 *   rapides. Un champ vide n'apprend à personne ce qu'un assistant sait faire ;
 *   la disposition en deux colonnes qui précédait consacrait les trois quarts
 *   de la page à une conversation vide, et le quart restant à un compteur de
 *   vues.
 * - **Dès la première question** — la barre d'appel et les aperçus s'effacent,
 *   le fil prend toute la largeur. Une réponse porte souvent un tableau de
 *   quatre colonnes : c'est la largeur qui lui manque, jamais la hauteur.
 *
 * Le retour au premier état passe par « Nouvelle question ».
 *
 * ## Les aperçus viennent du catalogue, pas d'une liste écrite en dur
 *
 * `GET /catalogue` dit les sources réellement accessibles **au rôle de
 * l'appelant** ; les tuiles n'en proposent que les domaines correspondants.
 * Sans ce filtre, un rôle PEDAGOGIE se verrait offrir « quelles classes ont le
 * plus d'impayés ? », que le garde SQL refuserait — un bouton qui ment.
 *
 * C'est le second appel bon marché du module, avec `/sante` : il n'interroge
 * aucun modèle. Les questions, elles, ne partent que sur une action explicite.
 */
const store = useAssistantStore();
const auth = useAuthStore();
const notifications = useNotificationStore();

onMounted(() => {
  // `/sante` dit si le module est utilisable avant que l'utilisateur ait tapé
  // quoi que ce soit ; `/catalogue` décide des aperçus affichés. Ni l'un ni
  // l'autre ne sollicite le modèle.
  store.fetchSante();
  store.fetchCatalogue();
  // Le rôle décide de l'affichage du SQL sous chaque réponse ; un
  // rechargement de page vide le profil en mémoire (voir `AssistantRequetes`).
  auth.fetchCurrentUser();
});

/** @param {string} question */
function demander(question) {
  if (store.enCours || store.utilisable === false) return;
  store.demander(question);
}

/**
 * Ouvre l'espace de chat, en reprenant le fil en cours s'il y en a un.
 *
 * Une question posée ici n'est pas perdue quand on veut la poursuivre : le fil
 * existe côté serveur, l'espace le rouvre par son identifiant.
 */
function ouvrirEspace() {
  const fenetre = ouvrirEspaceChat(
    store.conversationId ? cheminConversation(store.conversationId) : ESPACE_CHAT_BASE
  );

  // `window.open` rend `null` quand le navigateur bloque l'ouverture. Le taire
  // laisserait l'utilisateur devant un bouton qui « ne fait rien ».
  if (!fenetre) {
    notifications.notifyWarning(
      "L'onglet a été bloqué par le navigateur. Autorisez les fenêtres surgissantes pour ce site."
    );
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Assistant IA"
      subtitle="Questions rapides et aperçus sur les données de l'établissement"
      :breadcrumb="['Plateforme', 'Assistant']"
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm me-2 mt-2 mt-xl-0"
          :disabled="store.estVide || store.enCours"
          @click="store.nouvelleConversation"
        >
          <i class="bi bi-arrow-clockwise me-1"></i> Nouvelle question
        </button>

        <button type="button" class="btn btn-primary btn-sm mt-2 mt-xl-0" @click="ouvrirEspace">
          <i class="bi bi-box-arrow-up-right me-1"></i>
          {{
            store.conversationId ? "Poursuivre dans l'espace de chat" : "Ouvrir l'espace de chat"
          }}
        </button>
      </template>
    </PageHeader>

    <div v-if="store.utilisable === false" class="alert alert-warning" role="alert">
      <i class="bi bi-exclamation-triangle me-1"></i>
      <strong>Assistant indisponible.</strong>
      {{ store.raisonIndisponible }}
    </div>

    <div class="row">
      <div class="col-12 grid-margin">
        <!-- ── État d'accueil : la barre d'appel ─────────────────────────── -->
        <div v-if="store.estVide" class="card border-0 shadow-sm mb-3">
          <div class="card-body py-4 px-3">
            <div class="text-center mb-3">
              <span class="assistant-pastille">
                <i class="bi bi-robot"></i>
              </span>
              <h5 class="mt-2 mb-1 fw-bold">Que voulez-vous savoir ?</h5>
              <p class="text-body-secondary small mb-0">
                Posez une question sur les étudiants, la scolarité, les résultats, les enseignants —
                ou les finances si votre rôle y donne accès.
              </p>
            </div>

            <!-- Bridée en largeur : une ligne de saisie qui traverse un écran
                 de 1900 px se lit mal, et le regard perd le bouton d'envoi. -->
            <div class="assistant-appel mx-auto">
              <AssistantChamp
                variante="accueil"
                :en-cours="store.enCours"
                :desactive="store.utilisable === false"
                :suggestions="[]"
                placeholder="Ex. : combien d'étudiants par filière cette année ?"
                @demander="demander"
              />
            </div>
          </div>
        </div>

        <!-- ── État de réponse : le fil prend toute la largeur ────────────── -->
        <div v-else class="card border-0 shadow-sm mb-3">
          <div class="card-body d-flex flex-column p-3">
            <AssistantFil :messages="store.messages" :en-cours="store.enCours" hauteur="52vh" />

            <div class="mt-3">
              <AssistantChamp
                :en-cours="store.enCours"
                :desactive="store.utilisable === false"
                :suggestions="[]"
                placeholder="Posez une autre question…"
                @demander="demander"
              />
            </div>
          </div>
        </div>

        <!-- Les aperçus servent à démarrer : les garder sous une réponse
             pousserait un tableau de quinze lignes sous le pli. -->
        <AssistantApercus
          v-if="store.estVide"
          class="mb-3"
          :catalogue="store.catalogue"
          :desactive="store.enCours || store.utilisable === false"
          @demander="demander"
        />

        <AssistantSources :catalogue="store.catalogue" :sante="store.sante" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.assistant-pastille {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(101, 113, 255, 0.12);
  color: var(--bs-primary, #6571ff);
  font-size: 1.6rem;
}

.assistant-appel {
  max-width: 46rem;
}
</style>
