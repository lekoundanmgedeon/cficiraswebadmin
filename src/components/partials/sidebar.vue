<template>
  <nav id="sidebar" class="sidebar sidebar-offcanvas" :class="{ active: mobileOpen }">
    <ul class="nav">
      <li class="nav-item">
        <router-link class="nav-link" to="/home" :class="{ 'menu-active': isMenuActive('/home') }">
          <i class="mdi mdi-home menu-icon"></i>
          <span class="menu-title d-none d-md-inline">Tableau de Bord</span>
        </router-link>
      </li>

      <!-- Structure Académique -->
      <li class="nav-item">
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
      <li class="nav-item">
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
      <li class="nav-item">
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
      <li class="nav-item">
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
        >
          <i class="mdi mdi-calendar-clock menu-icon"></i>
          <span class="menu-title">Emploi du temps</span>
        </router-link>
      </li>

      <!-- Finances -->
      <li class="nav-item">
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
      <li class="nav-item">
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
        >
          <i class="mdi mdi-library menu-icon"></i>
          <span class="menu-title">Bibliothèque</span>
        </router-link>
      </li>

      <!-- Coordination académique -->
      <li class="nav-item">
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
        >
          <i class="mdi mdi-settings menu-icon"></i>
          <span class="menu-title">Paramètres</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
defineProps({
  mobileOpen: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['close-sidebar']);

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

/* Repli desktop : garde seulement les icônes */
@media (min-width: 992px) {
  .sidebar-icon-only .sidebar {
    width: 70px;
  }

  .sidebar-icon-only .sidebar .menu-title,
  .sidebar-icon-only .sidebar .menu-arrow,
  .sidebar-icon-only .sidebar .badge {
    display: none !important;
  }

  .sidebar-icon-only .main-panel {
    width: calc(100% - 70px);
  }

  .sidebar-icon-only .sidebar .nav .nav-item .nav-link {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }

  .sidebar-icon-only .sidebar .nav .nav-item .nav-link .menu-icon {
    margin-right: 0;
  }

  .sidebar-icon-only .sidebar .collapse.show {
    display: none;
  }
}

/* Mobile : ouverture / fermeture de la sidebar */
@media (max-width: 991px) {
  .sidebar.sidebar-offcanvas {
    position: fixed;
    left: -260px;
    top: 0;
    bottom: 0;
    width: 260px;
    z-index: 1030;
    transition: left 0.25s ease;
  }

  .sidebar.sidebar-offcanvas.active {
    left: 0;
  }

  .main-panel {
    width: 100%;
  }
}
</style>
