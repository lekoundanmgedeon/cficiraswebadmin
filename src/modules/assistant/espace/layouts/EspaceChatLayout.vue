<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/core/auth/authStore';
import { ESPACE_CHAT_BASE, cheminConversation } from '../../constants';
import { useEspaceChatStore } from '../store';
import ListeConversations from '../components/ListeConversations.vue';

/**
 * La coquille de l'espace de chat.
 *
 * ## Pourquoi une coquille, et pas un écran de plus dans l'application
 *
 * Une conversation longue veut toute la hauteur : une liste de fils à gauche,
 * le fil au centre, un champ de saisie ancré en bas. Dans `DefaultLayout`,
 * l'en-tête, le fil d'Ariane et la barre de menu prélèvent déjà un tiers de
 * l'écran, et le fil défilait dans une fenêtre de quelques centimètres.
 *
 * ## Ce qui la distingue de l'espace de notes
 *
 * Celui-ci a **sa propre session** : il range son jeton sous une autre clé et
 * exige sa propre connexion. L'espace de chat fait l'inverse — il partage la
 * session de l'application (portée `app`), et c'est ce qui permet d'y retrouver
 * ses propres conversations sans se reconnecter. Il n'a donc ni écran de
 * connexion, ni garde locale : la garde générale (`core/router/guards.js`)
 * protège tout ce qui ne se déclare pas `public`, et renvoie vers le `Login` de
 * l'application — la bonne porte, ici.
 *
 * Second écart : `height: 100vh; overflow: hidden`, quand l'espace de notes est
 * en `min-height: 100vh` et laisse défiler la page. Une grille de notes défile ;
 * un composeur de chat doit rester au bas de l'écran.
 */

const route = useRoute();
const router = useRouter();
const store = useEspaceChatStore();
const auth = useAuthStore();

const barreOuverte = ref(true);

const identite = computed(() => {
  const u = auth.user;
  if (!u) return '';
  return [u.prenom, u.nom].filter(Boolean).join(' ') || u.username || u.email || '';
});

/** L'identifiant du fil affiché, lu dans l'URL — le store peut être en retard. */
const filActif = computed(() => route.params.id ?? null);

onMounted(() => {
  // Le rôle décide de l'affichage du SQL sous chaque réponse et de l'accès à
  // l'audit ; un rechargement de page vide le profil en mémoire.
  auth.fetchCurrentUser();
  store.fetchSante();
  store.fetchConversations();
});

/**
 * Sous 768 px, la barre recouvre le fil au lieu de le côtoyer : l'y laisser
 * ouverte après un clic masquerait la conversation qu'on vient de demander.
 */
function replierSiEtroit() {
  if (window.innerWidth < 768) barreOuverte.value = false;
}

function ouvrir(id) {
  router.push(cheminConversation(id));
  replierSiEtroit();
}

function nouvelle() {
  // Le cadrage courant est conservé : ouvrir un fil neuf depuis une
  // conversation financière laisse supposer qu'on reste sur le sujet.
  store.nouvelleConversation(store.cadrage);
  if (route.path !== ESPACE_CHAT_BASE) router.push(ESPACE_CHAT_BASE);
  replierSiEtroit();
}
</script>

<template>
  <div class="espace-chat d-flex">
    <aside
      class="barre-laterale d-flex flex-column"
      :class="{ 'barre-laterale--fermee': !barreOuverte }"
    >
      <div class="d-flex align-items-center gap-2 px-3 py-2 border-bottom border-secondary-subtle">
        <i class="bi bi-robot text-primary fs-5"></i>
        <span class="fw-bold small flex-grow-1">Assistant IA</span>
        <button
          type="button"
          class="btn btn-sm btn-link text-body-secondary p-0"
          title="Replier la liste"
          @click="barreOuverte = false"
        >
          <i class="bi bi-chevron-left"></i>
        </button>
      </div>

      <ListeConversations
        class="flex-grow-1 overflow-hidden"
        :actif="filActif"
        @ouvrir="ouvrir"
        @nouvelle="nouvelle"
      />

      <div class="px-3 py-2 border-top border-secondary-subtle">
        <router-link
          v-if="auth.isAdmin"
          :to="`${ESPACE_CHAT_BASE}/audit`"
          class="d-block small text-decoration-none text-body-secondary mb-2"
        >
          <i class="bi bi-journal-text me-1"></i> Journal et statistiques
        </router-link>

        <div class="d-flex align-items-center gap-2">
          <div class="flex-grow-1 min-w-0">
            <div class="small fw-semibold text-truncate">{{ identite }}</div>
            <div class="text-body-secondary espace-role">{{ auth.user?.role }}</div>
          </div>

          <!-- Un lien, pas un `router-link` : l'application est dans l'autre
               onglet, et y naviguer *ici* remplacerait l'espace par elle. -->
          <a
            href="/"
            target="_blank"
            rel="noopener"
            class="btn btn-sm btn-link text-body-secondary p-0"
            title="Ouvrir l'application"
          >
            <i class="bi bi-box-arrow-up-right"></i>
          </a>
        </div>
      </div>
    </aside>

    <main class="panneau flex-grow-1 d-flex flex-column">
      <button
        v-if="!barreOuverte"
        type="button"
        class="btn btn-sm btn-light position-absolute m-2 espace-deplier"
        title="Afficher la liste des conversations"
        @click="barreOuverte = true"
      >
        <i class="bi bi-list"></i>
      </button>

      <router-view />
    </main>
  </div>
</template>

<style scoped>
/**
 * `height` et non `min-height` : c'est ce qui permet au fil de défiler dans son
 * propre cadre en laissant le champ de saisie ancré en bas. Avec `min-height`,
 * c'est la page entière qui défile et le champ disparaît sous le pli dès que la
 * conversation s'allonge.
 */
.espace-chat {
  height: 100vh;
  overflow: hidden;
  background: #f5f6fa;
}

.barre-laterale {
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e9ecef;
  transition: width 0.2s ease-in-out;
}

/* Repliée, elle disparaît entièrement : la garder à 60 px n'afficherait que
   des titres tronqués à deux mots, ce qui n'aide personne. */
.barre-laterale--fermee {
  width: 0;
  overflow: hidden;
  border-right: 0;
}

.panneau {
  min-width: 0;
  position: relative;
}

.espace-deplier {
  z-index: 5;
}

.espace-role {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.min-w-0 {
  min-width: 0;
}

/* Sous 768 px, la liste passe en tiroir : côte à côte, il ne resterait pas
   200 px pour un tableau de résultats. */
@media (max-width: 767.98px) {
  .barre-laterale {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1030;
    box-shadow: 0 0 24px rgba(0, 0, 0, 0.15);
  }
}
</style>
