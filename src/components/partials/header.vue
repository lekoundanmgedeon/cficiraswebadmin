<template>
  <nav class="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
    <div class="navbar-brand-wrapper d-flex justify-content-center">
      <div
        class="navbar-brand-inner-wrapper d-flex justify-content-between align-items-center w-100"
      >
        <a class="navbar-brand brand-logo" href="/home"
          ><img src="/img/photo-format.ico" alt="logo"
        /></a>
        <a class="navbar-brand brand-logo-mini" href="/home"
          ><img src="/img/logo1.ico" alt="logo"
        /></a>

        <!--
          Le basculeur de la barre latérale, à hauteur du logo — là où le
          gabarit avait placé un bouton qui n'a jamais rien commandé.

          Il est ici, et non sur la barre latérale, parce que le bandeau de
          marque et la barre ne font qu'une colonne : ils se rétrécissent
          ensemble, de 257 px à 70 px.
        -->
        <button
          type="button"
          class="navbar-bascule"
          :title="repliee ? 'Déployer le menu' : 'Replier le menu'"
          :aria-label="repliee ? 'Déployer le menu' : 'Replier le menu'"
          :aria-expanded="!repliee"
          @click="basculer"
        >
          <i class="mdi" :class="repliee ? 'mdi-chevron-right' : 'mdi-chevron-left'"></i>
        </button>
      </div>
    </div>
    <div class="navbar-menu-wrapper d-flex align-items-center justify-content-end">
      <ul class="navbar-nav mr-lg-4 w-100">
        <li class="nav-item nav-search d-none d-lg-block w-100">
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text" id="search">
                <i class="mdi mdi-magnify"></i>
              </span>
            </div>
            <input
              type="text"
              class="form-control"
              placeholder="Search now"
              aria-label="search"
              aria-describedby="search"
            />
          </div>
        </li>
      </ul>
      <ul class="navbar-nav navbar-nav-right">
        <li class="nav-item dropdown me-1">
          <a
            class="nav-link count-indicator dropdown-toggle d-flex justify-content-center align-items-center"
            id="messageDropdown"
            href="#"
            data-bs-toggle="dropdown"
          >
            <i class="mdi mdi-message-text mx-0"></i>
            <span class="count"></span>
          </a>
          <div
            class="dropdown-menu dropdown-menu-right navbar-dropdown"
            aria-labelledby="messageDropdown"
          >
            <p class="mb-0 font-weight-normal float-left dropdown-header">Messages</p>
          </div>
        </li>
        <li class="nav-item dropdown me-4">
          <a
            class="nav-link count-indicator dropdown-toggle d-flex align-items-center justify-content-center notification-dropdown"
            id="notificationDropdown"
            href="#"
            data-bs-toggle="dropdown"
          >
            <i class="mdi mdi-bell mx-0"></i>
            <span class="count"></span>
          </a>
          <div
            class="dropdown-menu dropdown-menu-right navbar-dropdown"
            aria-labelledby="notificationDropdown"
          >
            <p class="mb-0 font-weight-normal float-left dropdown-header">Notifications</p>
          </div>
        </li>
        <li class="nav-item nav-profile dropdown">
          <a
            class="nav-link dropdown-toggle"
            href="#"
            data-bs-toggle="dropdown"
            id="profileDropdown"
          >
            <img src="/img/faces/face29.png" alt="profile" />
            <span class="nav-profile-name">Gedeon LEKOUNDA</span>
          </a>
          <div
            class="dropdown-menu dropdown-menu-right navbar-dropdown"
            aria-labelledby="profileDropdown"
          >
            <a class="dropdown-item">
              <i class="mdi mdi-settings text-primary"></i>
              Settings
            </a>
            <a @click="handleLogout" class="dropdown-item">
              <i class="mdi mdi-logout text-primary"></i>
              Deconnexion
            </a>
          </div>
        </li>
      </ul>
    </div>
  </nav>
</template>
<script setup>
import { useAuthStore } from '@/core/auth/authStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useSidebarRepli } from '@/shared/composables/useSidebarRepli';

/**
 * La barre du haut.
 *
 * ## Un seul basculeur, à hauteur du logo
 *
 * Elle en portait deux, à ses deux extrémités, et aucun ne fonctionnait :
 *
 *  - celui du bandeau de marque (`data-toggle="minimize"`), hérité du gabarit
 *    HTML d'origine, **sans aucun gestionnaire** : il ne faisait rien. Le
 *    script jQuery qui l'aurait animé (`public/js/template.js`) bascule la
 *    classe sur `body`, là où l'application la pose sur `.container-scroller` ;
 *  - celui de droite, qui émettait `toggle-sidebar` vers une mise en page dont
 *    l'état ne se rétablissait jamais au redimensionnement : replié sur un
 *    portable puis rouvert sur un grand écran, on gardait une barre en icônes.
 *
 * Il n'en reste qu'un, à la place du premier : le bandeau de marque et la barre
 * latérale forment une seule colonne, qui se rétrécit d'un bloc de 257 px à
 * 70 px. Le chevron indique le sens du mouvement, et son choix se conserve —
 * la largeur de la fenêtre ne fixe plus qu'un défaut
 * (`shared/composables/useSidebarRepli.js`).
 */

const authStore = useAuthStore();
const { user, isAuthenticated } = storeToRefs(authStore);
const router = useRouter();

const { repliee, basculer } = useSidebarRepli();

const handleLogout = async () => {
  await authStore.logoutUser();
  router.push('/auth/login');
};
</script>

<style scoped>
/* Le chevron reprend la place — et la discrétion — du bouton du gabarit :
   pas de fond, pas de bordure, il ne se remarque qu'au survol. */
.navbar-bascule {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #9b9b9b;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.navbar-bascule:hover {
  color: #4d83ff;
  background-color: #f0f8ff;
}

.navbar-bascule .mdi {
  font-size: 1.35rem;
  line-height: 1;
}

/* Replié, le bandeau ne fait plus que 70 px : le gabarit y masque les deux
   logos, et le chevron occupe seul la place — centré, c'est lui qui rouvre. */
.sidebar-icon-only .navbar-bascule {
  margin: 0 auto;
}
</style>
