<template>
  <!-- `sidebar-offcanvas` a été retiré : la classe déclenchait, sous 992 px, la
       sortie d'écran prévue pour les téléphones — que plus aucun bouton ne
       ramenait une fois le basculeur de la barre du haut supprimé. -->
  <nav id="sidebar" class="sidebar">
    <!--
      Le basculeur vit ici, sur ce qu'il commande, et non dans la barre du haut
      où deux boutons se disputaient autrefois ce rôle sans qu'aucun ne le
      remplisse.

      Il **prime sur la largeur de la fenêtre** : celle-ci ne fixe qu'un défaut,
      et elle se trompe dès que le système applique une mise à l'échelle — un
      écran 1920 réglé à 150 % ne présente que 1280 pixels CSS.
    -->
    <button
      type="button"
      class="sidebar-bascule"
      :title="repliee ? 'Déployer le menu' : 'Replier le menu'"
      :aria-label="repliee ? 'Déployer le menu' : 'Replier le menu'"
      :aria-expanded="!repliee"
      @click="basculer"
    >
      <i class="mdi" :class="repliee ? 'mdi-chevron-right' : 'mdi-chevron-left'"></i>
      <span v-if="!repliee" class="sidebar-bascule-libelle">Replier</span>
    </button>

    <ul class="nav">
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/home"
          :class="{ 'menu-active': isMenuActive('/home') }"
          :title="repliee ? 'Tableau de Bord' : ''"
        >
          <i class="mdi mdi-home menu-icon"></i>
          <span class="menu-title d-none d-md-inline">Tableau de Bord</span>
        </router-link>
      </li>

      <!-- Structure Académique -->
      <li
        class="nav-item"
        :class="{ 'hover-open': survole === 'structure-academique' }"
        @mouseenter="survolerGroupe('structure-academique')"
        @mouseleave="survolerGroupe(null)"
        @click="cliquerGroupe('structure-academique')"
      >
        <a
          class="nav-link"
          :class="{ 'active-parent': isParentActive(menuGroups.structure) }"
          data-bs-toggle="collapse"
          href="#structure-academique"
          :aria-expanded="isParentActive(menuGroups.structure)"
        >
          <i class="mdi mdi-sitemap menu-icon"></i>
          <span class="menu-title">Structure Académique</span>
          <i class="menu-arrow"></i>
        </a>

        <div
          id="structure-academique"
          class="collapse"
          :class="{ show: isParentActive(menuGroups.structure) }"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/annees-academiques"
                :class="{ 'menu-active': isMenuActive('/annees-academiques') }"
              >
                Années académiques
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/cycles-academiques"
                :class="{ 'menu-active': isMenuActive('/cycles-academiques') }"
              >
                Cycles
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/filieres-academiques"
                :class="{ 'menu-active': isMenuActive('/filieres-academiques') }"
              >
                Filières
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/classes-niveaux"
                :class="{ 'menu-active': isMenuActive('/classes-niveaux') }"
              >
                Classes
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/semestres"
                :class="{ 'menu-active': isMenuActive('/semestres') }"
              >
                Semestres
              </router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Scolarité -->
      <li
        class="nav-item"
        :class="{ 'hover-open': survole === 'scolarite' }"
        @mouseenter="survolerGroupe('scolarite')"
        @mouseleave="survolerGroupe(null)"
        @click="cliquerGroupe('scolarite')"
      >
        <a
          class="nav-link"
          :class="{ 'active-parent': isParentActive(menuGroups.scolarite) }"
          data-bs-toggle="collapse"
          href="#scolarite"
          :aria-expanded="isParentActive(menuGroups.scolarite)"
        >
          <i class="mdi mdi-account-group menu-icon"></i>
          <span class="menu-title">Scolarité</span>
          <i class="menu-arrow"></i>
        </a>

        <div
          id="scolarite"
          class="collapse"
          :class="{ show: isParentActive(menuGroups.scolarite) }"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/etudiants"
                :class="{ 'menu-active': isMenuActive('/etudiants') }"
              >
                Gestion des étudiants
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/dossiers-scolaires"
                :class="{ 'menu-active': isMenuActive('/dossiers-scolaires') }"
              >
                Dossiers scolaires
              </router-link>
            </li>

            <!-- « Absences & Présences » a été retiré : l'écran était intégralement
                 simulé (il affichait « Fiche enregistrée avec succès » sans rien
                 envoyer) et aucune route d'absence n'existe côté backend. À
                 rétablir le jour où le serveur en expose. -->

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/notes"
                :class="{ 'menu-active': isMenuActive('/notes') }"
              >
                Évaluations & Notes
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/deliberations"
                :class="{ 'menu-active': isMenuActive('/deliberations') }"
              >
                Délibérations
              </router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Examens -->
      <li
        class="nav-item"
        :class="{ 'hover-open': survole === 'examens' }"
        @mouseenter="survolerGroupe('examens')"
        @mouseleave="survolerGroupe(null)"
        @click="cliquerGroupe('examens')"
      >
        <a
          class="nav-link"
          :class="{ 'active-parent': isParentActive(menuGroups.examens) }"
          data-bs-toggle="collapse"
          href="#examens"
          :aria-expanded="isParentActive(menuGroups.examens)"
        >
          <i class="mdi mdi-book-open menu-icon"></i>
          <span class="menu-title">Examens</span>
          <i class="menu-arrow"></i>
        </a>

        <div id="examens" class="collapse" :class="{ show: isParentActive(menuGroups.examens) }">
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/planification-examens"
                :class="{ 'menu-active': isMenuActive('/planification-examens') }"
              >
                Planification
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/calendrier-examens"
                :class="{ 'menu-active': isMenuActive('/calendrier-examens') }"
              >
                Calendrier
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/salles-horaires"
                :class="{ 'menu-active': isMenuActive('/salles-horaires') }"
              >
                Salles & horaires
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/rapport-examens"
                :class="{ 'menu-active': isMenuActive('/rapport-examens') }"
              >
                Rapports
              </router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Concours -->
      <li
        class="nav-item"
        :class="{ 'hover-open': survole === 'concours' }"
        @mouseenter="survolerGroupe('concours')"
        @mouseleave="survolerGroupe(null)"
        @click="cliquerGroupe('concours')"
      >
        <a
          class="nav-link"
          :class="{ 'active-parent': isParentActive(menuGroups.concours) }"
          data-bs-toggle="collapse"
          href="#concours"
          :aria-expanded="isParentActive(menuGroups.concours)"
        >
          <i class="mdi mdi-trophy menu-icon"></i>
          <span class="menu-title">Concours</span>
          <i class="menu-arrow"></i>
        </a>

        <div id="concours" class="collapse" :class="{ show: isParentActive(menuGroups.concours) }">
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/edition-concours"
                :class="{ 'menu-active': isMenuActive('/edition-concours') }"
              >
                Editions
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/rapport-concours"
                :class="{ 'menu-active': isMenuActive('/rapport-concours') }"
              >
                Rapports
              </router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Inscriptions -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/inscriptions"
          :class="{ 'menu-active': isMenuActive('/inscriptions') }"
          :title="repliee ? 'Inscriptions' : ''"
        >
          <i class="mdi mdi-view-headline menu-icon"></i>
          <span class="menu-title">Inscriptions</span>
        </router-link>
      </li>

      <!-- Modules d'enseignement.
           L'écran existait sous `views/matieres/` mais n'était référencé par
           aucune route ni aucun menu : il était inaccessible. -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/modules"
          :class="{ 'menu-active': isMenuActive('/modules') }"
          :title="repliee ? 'Modules' : ''"
        >
          <i class="mdi mdi-book-open-page-variant menu-icon"></i>
          <span class="menu-title">Modules</span>
        </router-link>
      </li>

      <!-- Emploi du temps -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/schedule"
          :class="{ 'menu-active': isMenuActive('/schedule') }"
          :title="repliee ? 'Emploi du temps' : ''"
        >
          <i class="mdi mdi-calendar-clock menu-icon"></i>
          <span class="menu-title">Emploi du temps</span>
        </router-link>
      </li>

      <!-- Finances -->
      <li
        class="nav-item"
        :class="{ 'hover-open': survole === 'finances' }"
        @mouseenter="survolerGroupe('finances')"
        @mouseleave="survolerGroupe(null)"
        @click="cliquerGroupe('finances')"
      >
        <a
          class="nav-link"
          :class="{ 'active-parent': isParentActive(menuGroups.finances) }"
          data-bs-toggle="collapse"
          href="#finances"
          :aria-expanded="isParentActive(menuGroups.finances)"
        >
          <i class="mdi mdi-wallet menu-icon"></i>
          <span class="menu-title">Finances</span>
          <i class="menu-arrow"></i>
        </a>

        <div id="finances" class="collapse" :class="{ show: isParentActive(menuGroups.finances) }">
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/paiements-finances"
                :class="{ 'menu-active': isMenuActive('/paiements-finances') }"
              >
                Paiements & reçus
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/factures-finances"
                :class="{ 'menu-active': isMenuActive('/factures-finances') }"
              >
                Facturations
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/rapports-financiers"
                :class="{ 'menu-active': isMenuActive('/rapports-financiers') }"
              >
                Rapports
              </router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Affaires pédagogiques -->
      <li
        class="nav-item"
        :class="{ 'hover-open': survole === 'pedagogique' }"
        @mouseenter="survolerGroupe('pedagogique')"
        @mouseleave="survolerGroupe(null)"
        @click="cliquerGroupe('pedagogique')"
      >
        <a
          class="nav-link"
          :class="{ 'active-parent': isParentActive(menuGroups.pedagogique) }"
          data-bs-toggle="collapse"
          href="#pedagogique"
          :aria-expanded="isParentActive(menuGroups.pedagogique)"
        >
          <i class="mdi mdi-school menu-icon"></i>
          <span class="menu-title">Affaires pédagogiques</span>
          <i class="menu-arrow"></i>
        </a>

        <div
          id="pedagogique"
          class="collapse"
          :class="{ show: isParentActive(menuGroups.pedagogique) }"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/enseignants"
                :class="{ 'menu-active': isMenuActive('/enseignants') }"
              >
                Enseignants
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/attribution-cours"
                :class="{ 'menu-active': isMenuActive('/attribution-cours') }"
              >
                Attribution des cours
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/crenaux-horaires"
                :class="{ 'menu-active': isMenuActive('/crenaux-horaires') }"
              >
                Creneaux / Horaires
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/programmes-credits"
                :class="{ 'menu-active': isMenuActive('/programmes-credits') }"
              >
                Programmes / Crédits
              </router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Ressources matérielles -->

      <!-- Services -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/administration"
          :class="{ 'menu-active': isMenuActive('/administration') }"
          :title="repliee ? 'Services' : ''"
        >
          <i class="mdi mdi-briefcase menu-icon"></i>
          <span class="menu-title">Services</span>
        </router-link>
      </li>

      <!-- Bibliothèque -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/bibliotheque"
          :class="{ 'menu-active': isMenuActive('/bibliotheque') }"
          :title="repliee ? 'Bibliothèque' : ''"
        >
          <i class="mdi mdi-library menu-icon"></i>
          <span class="menu-title">Bibliothèque</span>
        </router-link>
      </li>

      <!-- Coordination académique -->
      <li
        class="nav-item"
        :class="{ 'hover-open': survole === 'coordination' }"
        @mouseenter="survolerGroupe('coordination')"
        @mouseleave="survolerGroupe(null)"
        @click="cliquerGroupe('coordination')"
      >
        <a
          class="nav-link"
          :class="{ 'active-parent': isParentActive(menuGroups.coordination) }"
          data-bs-toggle="collapse"
          href="#coordination"
          :aria-expanded="isParentActive(menuGroups.coordination)"
        >
          <i class="mdi mdi-clipboard-text menu-icon"></i>
          <span class="menu-title">Coordination académique</span>
          <i class="menu-arrow"></i>
        </a>

        <div
          id="coordination"
          class="collapse"
          :class="{ show: isParentActive(menuGroups.coordination) }"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/themes-memoires"
                :class="{ 'menu-active': isMenuActive('/themes-memoires') }"
              >
                Thèmes & mémoires
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/soutenances"
                :class="{ 'menu-active': isMenuActive('/soutenances') }"
              >
                Soutenances
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                class="nav-link"
                to="/statut"
                :class="{ 'menu-active': isMenuActive('/statut') }"
              >
                Statut étudiant
              </router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Diplômes & documents administratifs -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/documents"
          :class="{ 'menu-active': isMenuActive('/documents') }"
          :title="repliee ? 'Diplômes & documents' : ''"
        >
          <i class="mdi mdi-certificate menu-icon"></i>
          <span class="menu-title">Diplômes & documents</span>
        </router-link>
      </li>

      <!-- Courrier -->

      <!-- Notifications -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/notification"
          :class="{ 'menu-active': isMenuActive('/notification') }"
          :title="repliee ? 'Notifications' : ''"
        >
          <i class="mdi mdi-bell menu-icon"></i>
          <span class="menu-title">Notifications</span>
        </router-link>
      </li>

      <!-- Statistiques -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/statistiques"
          :class="{ 'menu-active': isMenuActive('/statistiques') }"
          :title="repliee ? 'Statistiques' : ''"
        >
          <i class="mdi mdi-chart-bar menu-icon"></i>
          <span class="menu-title">Statistiques</span>
        </router-link>
      </li>

      <!-- Assistant AI -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/assistant-ai"
          :class="{ 'menu-active': isMenuActive('/assistant-ai') }"
          :title="repliee ? 'Assistant AI' : ''"
        >
          <i class="mdi mdi-robot menu-icon text-primary"></i>
          <span class="menu-title fw-bold">Assistant AI</span>
          <span class="badge badge-info ms-2 small" style="font-size: 10px"> Beta </span>
        </router-link>
      </li>

      <!-- Paramètres -->
      <li class="nav-item">
        <router-link
          class="nav-link"
          to="/settings"
          :class="{ 'menu-active': isMenuActive('/settings') }"
          :title="repliee ? 'Paramètres' : ''"
        >
          <i class="mdi mdi-settings menu-icon"></i>
          <span class="menu-title">Paramètres</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useSidebarRepli } from '@/shared/composables/useSidebarRepli';

/**
 * La barre latérale de navigation.
 *
 * ## Repliée, elle ouvre ses groupes au survol
 *
 * Sous 1440 px, elle se réduit à ses icônes (`useSidebarRepli`). Les
 * sous-menus sont alors masqués par la feuille du gabarit — et sans rien de
 * plus, **sept des dix rubriques deviendraient inatteignables** : leur entrée
 * de premier niveau n'est pas une route, seulement l'en-tête d'un groupe.
 *
 * Le gabarit prévoyait ce cas : ses règles `.hover-open` sortent le titre et le
 * sous-menu en surimpression, à droite de l'icône. Mais la classe était posée
 * par un script jQuery (`public/js/hoverable-collapse.js`) qui la conditionne à
 * `body.sidebar-icon-only`, là où l'application marque `.container-scroller` :
 * il ne s'est jamais déclenché. C'est ce composant qui la pose désormais, au
 * survol, et **seulement quand la barre est repliée** — déployée, les groupes
 * s'ouvrent au clic, comme avant.
 */
const route = useRoute();

const { repliee, basculer } = useSidebarRepli();

/** Le groupe dont le sous-menu est ouvert en surimpression. */
const survole = ref(null);

/** @param {string|null} id Identifiant du groupe, ou `null` à la sortie. */
const survolerGroupe = (id) => {
  survole.value = repliee.value ? id : null;
};

/**
 * Le clic sur un groupe replié ouvre lui aussi sa surimpression.
 *
 * S'en remettre au seul survol supposait une souris, et surtout que le
 * déplacement soit assez lent pour que le navigateur émette l'événement. Un
 * clic sur l'icône ne produisait, lui, aucun effet visible : `data-bs-toggle`
 * dépliait bien le sous-menu, mais la feuille du gabarit le masque en mode
 * icônes. Cliquer sans que rien ne bouge est ce qui donne l'impression que le
 * menu ne répond plus.
 *
 * @param {string} id
 */
const cliquerGroupe = (id) => {
  if (!repliee.value) return;
  survole.value = survole.value === id ? null : id;
};

const menuGroups = {
  structure: [
    '/annees-academiques',
    '/cycles-academiques',
    '/filieres-academiques',
    '/classes-niveaux',
    '/semestres',
  ],

  scolarite: ['/etudiants', '/dossiers-scolaires', '/notes', '/deliberations'],

  // Les trois écrans de la coordination : attribution des thèmes, soutenances
  // et suivi des finalistes. Le groupe s'ouvre dès que l'un d'eux est actif.
  coordination: ['/themes-memoires', '/soutenances', '/statut'],

  examens: [
    '/planification-examens',
    '/calendrier-examens',
    '/salles-horaires',
    '/rapport-examens',
  ],

  concours: ['/edition-concours', '/rapport-concours'],

  finances: ['/paiements-finances', '/factures-finances', '/rapports-financiers'],

  pedagogique: [
    '/enseignants',
    '/attribution-cours',
    '/crenaux-horaires',
    '/programmes-credits',
    '/schedule',
  ],
};

const isMenuActive = (basePath) => {
  if (!basePath) return false;

  return route.path === basePath || route.path.startsWith(`${basePath}/`);
};

const isParentActive = (childRoutes) => {
  return childRoutes.some((routePath) => isMenuActive(routePath));
};
</script>

<style scoped>
/* Le basculeur : discret, mais toujours au même endroit — en haut de ce qu'il
   commande. Replié, il ne reste que le chevron, centré comme les icônes. */
.sidebar-bascule {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  width: 100%;
  padding: 0.45rem 1.1rem;
  border: 0;
  border-bottom: 1px solid #e3e3e3;
  background: transparent;
  color: #9b9b9b;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.2s ease;
}

.sidebar-bascule:hover {
  color: #4d83ff;
  background-color: #f0f8ff;
}

.sidebar-bascule .mdi {
  font-size: 1.05rem;
  line-height: 1;
}

/* Réduite à 70 px, la barre ne laisse plus de place qu'au chevron. */
.sidebar-icon-only .sidebar-bascule {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

/*
  ─── Les groupes, une fois la barre repliée ──────────────────────────────

  Sept rubriques sur dix n'ont pas de route propre : leur entrée de premier
  niveau n'est que l'en-tête d'un groupe. Repliées, elles ne sont atteignables
  que par cette surimpression — si elle ne s'affiche pas, le menu ne répond
  plus, et c'est ce qui a été constaté à l'usage.

  La feuille du gabarit décrit bien un affichage de ce genre, mais il repose sur
  ses propres hypothèses : `@media (min-width: 992px)`, `overflow` rétabli au
  bon niveau, `position` posée sur le bon élément. Une seule qui saute et la
  surimpression reste invisible, sans que rien ne l'indique. On la décrit donc
  ici en entier : ces règles-ci sont *scopées*, donc plus spécifiques, et
  gagnent quoi qu'il arrive.
*/
.sidebar-icon-only .sidebar .nav {
  /* Sans quoi la surimpression est coupée net au bord des 70 px. */
  overflow: visible;
}

.sidebar-icon-only .sidebar .nav > .nav-item {
  /* Le repère à partir duquel la surimpression se positionne. */
  position: relative;
}

/* Le libellé du groupe, sorti à droite de l'icône. */
.sidebar-icon-only .sidebar .nav > .nav-item.hover-open > .nav-link .menu-title {
  display: flex;
  align-items: center;
  position: absolute;
  left: 70px;
  top: 0;
  bottom: 0;
  width: 220px;
  padding: 0.5rem 1.4rem;
  background: #ffffff;
  color: #4d83ff;
  text-align: left;
  z-index: 12;
  box-shadow: 4px 0 7px 0 rgba(182, 185, 189, 0.25);
}

/* Le sous-menu, juste en dessous. `display` doit l'emporter sur le `none` que
   le gabarit applique à tout `.collapse` en mode icônes. */
.sidebar-icon-only .sidebar .nav > .nav-item.hover-open > .collapse,
.sidebar-icon-only .sidebar .nav > .nav-item.hover-open > .collapse.show {
  display: block;
  position: absolute;
  left: 70px;
  top: 100%;
  width: 220px;
  padding: 0.35rem 0;
  background: #ffffff;
  border-radius: 0 0 5px 0;
  z-index: 12;
  box-shadow: 4px 4px 7px 0 rgba(182, 185, 189, 0.25);
}

.sidebar-icon-only .sidebar .nav > .nav-item.hover-open .sub-menu .nav-link {
  text-align: left;
  padding-left: 1.4rem;
}

.nav-link.active-parent {
  background-color: #f0f8ff;
  color: #4d83ff !important;
  font-weight: 600;
  border-left: 3px solid #4d83ff;
}

.sidebar .nav-link.menu-active,
.sidebar .nav-link.router-link-exact-active {
  color: #4d83ff !important;
  font-weight: 600;
  background-color: #f8f9fa;
  border-left: 3px solid #4d83ff;
}

.sidebar .sub-menu .nav-link.menu-active,
.sidebar .sub-menu .router-link-exact-active {
  color: #000 !important;
  font-weight: 600;
  background-color: #f8f9fa;
  border-left: 3px solid #000;
}

/* Hover effects */
.sidebar .nav-link:hover {
  background-color: #f0f8ff;
  color: #4d83ff !important;
  border-left: 2px solid #4d83ff;
  transition: all 0.2s ease;
}

.sidebar .sub-menu .nav-link:hover {
  background-color: #f8f9fa;
  color: #000 !important;
  border-left: 2px solid #000;
  transition: all 0.2s ease;
}

/* Click effect */
.sidebar .nav-link:active {
  background-color: #e6f3ff;
  transform: scale(0.98);
  transition: all 0.1s ease;
}

/*
  Le repli lui-même n'est pas décrit ici.

  Ce bloc en tenait une seconde version, incomplète et pour partie inopérante :
  un style *scopé* n'ajoute son attribut qu'au dernier sélecteur, si bien que
  `.sidebar-icon-only .main-panel` ne visait rien — `.main-panel` appartient à
  `DefaultLayout`. La barre se réduisait à 70 px, le panneau restait calculé sur
  257, et 187 px de blanc s'ouvraient entre les deux.

  La feuille du gabarit (`assets/css/style.css`, section « Layouts ») décrit
  déjà ce mode en entier — largeur, bandeau de marque, panneau, et surtout les
  sous-menus en surimpression au survol, que cette copie ne connaissait pas et
  que sa règle `.collapse.show { display: none }` aurait de surcroît neutralisés.
  On s'appuie dessus ; les seuls correctifs nécessaires sont dans
  `DefaultLayout`, hors portée scopée, là où ils peuvent s'appliquer.
*/
</style>
