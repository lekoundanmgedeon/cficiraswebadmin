<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/core/auth/authStore';
import { capacitesDe, ETAPES, peut, roleInfo } from '../constants';

/**
 * Coquille de l'espace de gestion des notes.
 *
 * L'espace s'ouvre dans une fenêtre minimale (`window.open`, sans barre
 * d'outils ni menus) : il ne reprend donc **ni l'en-tête ni le menu de
 * l'application**. Sa navigation tient dans une barre latérale, et les entrées
 * qu'elle affiche dépendent des capacités du rôle connecté — un enseignant n'a
 * pas à voir « Moyennes & bulletins », qu'il ne peut de toute façon pas
 * déclencher.
 *
 * Le filtrage est du confort d'affichage. La règle qui fait foi est celle du
 * serveur : chaque transition de statut y est revérifiée, et répond 403 si le
 * rôle ne la porte pas.
 */

const router = useRouter();
const auth = useAuthStore();

const deconnexionEnCours = ref(false);

const role = computed(() => auth.user?.role ?? null);
const infosRole = computed(() => roleInfo(role.value));
const capacites = computed(() => capacitesDe(role.value));

const identite = computed(() => {
  const utilisateur = auth.user;
  if (!utilisateur) return '—';
  const nom = [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(' ');
  return nom || utilisateur.username || utilisateur.email || '—';
});

const NAVIGATION = [
  {
    nom: 'EspaceNotesTableauBord',
    label: 'Tableau de bord',
    icone: 'bi-speedometer2',
    capacite: null,
  },
  { nom: 'EspaceNotesGrille', label: 'Grilles de notes', icone: 'bi-table', capacite: null },
  {
    nom: 'EspaceNotesMoyennes',
    label: 'Moyennes & bulletins',
    icone: 'bi-calculator',
    capacite: 'moyennes',
  },
];

const navigation = computed(() =>
  NAVIGATION.filter((entree) => !entree.capacite || peut(role.value, entree.capacite))
);

/** L'étape du flux dont le rôle connecté a la charge. */
const etapeDuRole = computed(() =>
  ETAPES.find((etape) => etape.capacite && peut(role.value, etape.capacite))
);

onMounted(() => auth.fetchCurrentUser());

async function deconnecter() {
  deconnexionEnCours.value = true;
  await auth.logoutUser();
  deconnexionEnCours.value = false;
  router.replace({ name: 'EspaceNotesConnexion' });
}
</script>

<template>
  <div class="espace-notes">
    <aside class="barre-laterale d-flex flex-column">
      <div class="marque px-3 py-4">
        <span class="d-block fw-bold text-white">Espace notes</span>
        <span class="text-uppercase small opacity-75">Gestion & validation</span>
      </div>

      <nav class="flex-grow-1 px-2">
        <RouterLink
          v-for="entree in navigation"
          :key="entree.nom"
          :to="{ name: entree.nom }"
          class="lien-nav d-flex align-items-center gap-2 px-3 py-2 mb-1 rounded"
          active-class="actif"
        >
          <i class="bi" :class="entree.icone"></i>
          <span>{{ entree.label }}</span>
        </RouterLink>
      </nav>

      <div class="px-3 py-3 border-top border-secondary border-opacity-25">
        <div class="small text-white-50 text-uppercase mb-1">Connecté</div>
        <div class="text-white fw-semibold text-truncate">{{ identite }}</div>
        <div class="small text-white-50">{{ infosRole.label }}</div>
        <div v-if="etapeDuRole" class="small text-white-50 fst-italic mt-1">
          {{ infosRole.mission }}
        </div>

        <button
          class="btn btn-sm btn-outline-light w-100 mt-3"
          type="button"
          :disabled="deconnexionEnCours"
          @click="deconnecter"
        >
          <i class="bi bi-box-arrow-right me-1"></i>
          {{ deconnexionEnCours ? 'Déconnexion…' : 'Se déconnecter' }}
        </button>
        <p class="text-white-50 mt-2 mb-0" style="font-size: 10px">
          Cette session est propre à l'espace notes : elle ne touche pas celle de l'application.
        </p>
      </div>
    </aside>

    <main class="panneau">
      <div class="bandeau d-flex align-items-center justify-content-between px-4 py-3">
        <div>
          <h1 class="h5 mb-0 fw-bold">{{ $route.meta.title ?? 'Espace notes' }}</h1>
          <p class="text-muted small mb-0">
            Saisie, vérification, validation et publication des notes de l'année académique active.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <span
            v-for="capacite in capacites"
            :key="capacite"
            class="badge bg-primary-subtle text-primary text-capitalize"
          >
            {{ capacite.replace('_', ' ') }}
          </span>
        </div>
      </div>

      <div class="contenu p-4">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
/*
 * La barre latérale est **fixée à la fenêtre**, pas au flux.
 *
 * En `position: sticky` dans un conteneur flex, elle suivait le défilement de
 * la page : sur une grille de notes longue, le sélecteur de classe et le bouton
 * de déconnexion sortaient de l'écran. `fixed` l'ancre au viewport ; le panneau
 * de contenu compense par une marge de la même largeur, sinon il passerait
 * dessous.
 */
.espace-notes {
  min-height: 100vh;
  background: #f5f6fa;
}

.barre-laterale {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--largeur-barre);
  background: #1f2437;
  z-index: 1030;
  /* La barre elle-même ne défile jamais : seule sa navigation le fait, et
     uniquement si les entrées venaient à dépasser. */
  overflow: hidden;
}

.marque {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.lien-nav {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 0.9rem;
}

.lien-nav:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.lien-nav.actif {
  background: rgba(13, 110, 253, 0.85);
  color: #fff;
}

.panneau {
  margin-left: var(--largeur-barre);
  min-width: 0;
}

.bandeau {
  background: #fff;
  border-bottom: 1px solid #e9ecef;
}

/* Sous 768 px, une barre fixe de 240 px mangerait l'écran : elle repasse dans
   le flux, en haut, et le panneau reprend toute la largeur. La fenêtre s'ouvre
   à 1440 px, mais elle reste redimensionnable. */
@media (max-width: 767.98px) {
  .barre-laterale {
    position: static;
    width: 100%;
    height: auto;
  }

  .panneau {
    margin-left: 0;
  }
}
</style>
