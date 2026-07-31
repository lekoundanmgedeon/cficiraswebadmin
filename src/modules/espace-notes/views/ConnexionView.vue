<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/core/auth/authStore';
import { ETAPES, ROLES_AUTORISES, roleInfo } from '../constants';

/**
 * Connexion à l'espace de gestion des notes.
 *
 * L'espace tient **sa propre session** : le jeton obtenu ici est rangé sous une
 * clé distincte (`token:espace-notes`, voir `core/auth/tokenStorage.js`).
 * Ouvrir l'espace depuis une application déjà connectée exige donc de
 * s'identifier — c'est voulu : on ne saisit pas, ne valide pas et ne publie pas
 * des notes sous la session laissée ouverte par quelqu'un d'autre.
 *
 * Le contrôle de rôle est fait ici **et** à chaque appel côté serveur. Refuser
 * l'entrée à un rôle sans capacité évite surtout un espace vide et des 403 en
 * cascade.
 */

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const username = ref('');
const password = ref('');
const message = ref('');
const enCours = ref(false);

const roles = ETAPES.filter((etape) => etape.role).map((etape) => ({
  ...etape,
  info: roleInfo(etape.role),
}));

const peutSoumettre = computed(
  () => username.value.trim().length > 0 && password.value.length > 0 && !enCours.value
);

async function connecter() {
  message.value = '';
  enCours.value = true;

  const ok = await auth.loginUser({
    username: username.value.trim(),
    password: password.value,
  });

  if (!ok) {
    enCours.value = false;
    message.value = auth.error ?? 'Identifiants invalides.';
    return;
  }

  // Le profil complet — donc le rôle — n'arrive pas toujours avec le jeton :
  // on le demande avant de décider si cette personne a sa place ici.
  const utilisateur = auth.user?.role ? auth.user : await auth.fetchCurrentUser(true);
  const role = String(utilisateur?.role ?? '').toUpperCase();

  enCours.value = false;

  if (!ROLES_AUTORISES.includes(role)) {
    message.value = `Le rôle ${role || 'inconnu'} n'a aucune attribution dans la gestion des notes.`;
    await auth.logoutUser();
    return;
  }

  router.replace(route.query.redirect || { name: 'EspaceNotesTableauBord' });
}
</script>

<template>
  <div class="page-connexion d-flex align-items-center justify-content-center p-4">
    <div class="carte shadow-sm bg-white rounded-3 overflow-hidden">
      <div class="row g-0">
        <div class="col-md-6 p-4 p-md-5">
          <h1 class="h4 fw-bold mb-1">Espace notes</h1>
          <p class="text-muted small mb-4">
            Saisie, vérification, validation et publication des notes.
          </p>

          <form @submit.prevent="connecter">
            <div class="mb-3">
              <label for="notes-username" class="form-label small fw-semibold"> Identifiant </label>
              <input
                id="notes-username"
                v-model="username"
                type="text"
                class="form-control"
                autocomplete="username"
                required
              />
            </div>

            <div class="mb-3">
              <label for="notes-password" class="form-label small fw-semibold">
                Mot de passe
              </label>
              <input
                id="notes-password"
                v-model="password"
                type="password"
                class="form-control"
                autocomplete="current-password"
                required
              />
            </div>

            <div v-if="message" class="alert alert-danger py-2 small" role="alert">
              {{ message }}
            </div>

            <button type="submit" class="btn btn-primary w-100" :disabled="!peutSoumettre">
              <span
                v-if="enCours"
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              ></span>
              {{ enCours ? 'Connexion…' : 'Entrer dans l’espace' }}
            </button>
          </form>

          <p class="text-muted mt-3 mb-0" style="font-size: 11px">
            Cette connexion est indépendante de celle de l'application : s'y déconnecter ne ferme
            pas l'autre fenêtre.
          </p>
        </div>

        <div class="col-md-6 panneau-droite p-4 p-md-5 text-white">
          <h2 class="h6 text-uppercase opacity-75 mb-3">Qui fait quoi</h2>
          <ul class="list-unstyled mb-0">
            <li v-for="etape in roles" :key="etape.id" class="mb-3">
              <span class="badge bg-white text-dark me-2">{{ etape.label }}</span>
              <span class="fw-semibold">{{ etape.info.label }}</span>
              <span class="d-block small opacity-75">{{ etape.description }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-connexion {
  min-height: 100vh;
  background: #f5f6fa;
}

.carte {
  max-width: 860px;
  width: 100%;
}

.panneau-droite {
  background: #1f2437;
}
</style>
