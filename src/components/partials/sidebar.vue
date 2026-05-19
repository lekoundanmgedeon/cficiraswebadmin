<template>
  <nav class="sidebar sidebar-offcanvas" id="sidebar">
    <ul class="nav">
      <!-- Tableau de bord -->
      <li class="nav-item">
        <router-link class="nav-link" to="/home">
          <i class="mdi mdi-home menu-icon"></i>
          <span class="menu-title d-none d-md-inline">Tableau de Bord</span>
        </router-link>
      </li>
      <!-- Structure Académique -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            'active-parent': isParentActive([
              '/annees-academiques',
              '/cycles-academiques',
              '/filieres-academiques',
              '/classes-niveaux',
              '/semestres',
            ]),
          }"
          data-bs-toggle="collapse"
          href="#structure-academique"
          aria-expanded="false"
          :aria-expanded="
            isParentActive([
              '/annees-academiques',
              '/cycles-academiques',
              '/filieres-academiques',
              '/classes-niveaux',
              '/semestres',
            ])
          "
        >
          <i class="mdi mdi-sitemap menu-icon"></i>
          <span class="menu-title">Structure Académique</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{
            show: isParentActive([
              '/annees-academiques',
              '/cycles-academiques',
              '/filieres-academiques',
              '/classes-niveaux',
              '/semestres',
            ]),
          }"
          id="structure-academique"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/annees-academiques"
                >Années académiques</router-link
              >
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/cycles-academiques">Cycles</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/filieres-academiques">Filières</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/classes-niveaux">Classes</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/semestres">Semestres</router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Scolarité -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            'active-parent': isParentActive([
              '/etudiants',
              '/dossiers-scolaires',
              '/absences',
              '/notes',
              '/deliberations',
            ]),
          }"
          data-bs-toggle="collapse"
          href="#scolarite"
          :aria-expanded="
            isParentActive([
              '/etudiants',
              '/dossiers-scolaires',
              '/absences',
              '/notes',
              '/deliberations',
            ])
          "
        >
          <i class="mdi mdi-account-group menu-icon"></i>
          <span class="menu-title">Scolarité</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{
            show: isParentActive([
              '/etudiants',
              '/dossiers-scolaires',
              '/absences',
              '/notes',
              '/deliberations',
            ]),
          }"
          id="scolarite"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/etudiants">Gestion des étudiants</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/dossiers-scolaires"
                >Dossiers scolaires</router-link
              >
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/absences">Absences & Présences</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/notes">Évaluations & Notes</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/deliberations">Délibérations</router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Examens -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            'active-parent': isParentActive([
              '/planification-examens',
              '/calendrier-examens',
              '/salles-horaires',
              '/rapport-examens',
            ]),
          }"
          data-bs-toggle="collapse"
          href="#examens"
          :aria-expanded="
            isParentActive([
              '/planification-examens',
              '/calendrier-examens',
              '/salles-horaires',
              '/rapport-examens',
            ])
          "
        >
          <i class="mdi mdi-book-open menu-icon"></i>
          <span class="menu-title">Examens</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{
            show: isParentActive([
              '/planification-examens',
              '/calendrier-examens',
              '/salles-horaires',
              '/rapport-examens',
            ]),
          }"
          id="examens"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/planification-examens">Planification</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/calendrier-examens">Calendrier</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/salles-horaires">Salles & horaires</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/rapport-examens">Rapports</router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Concours -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            'active-parent': isParentActive([
              '/edition-concours',
              '/resultats-concours',
              '/rapport-concours',
            ]),
          }"
          data-bs-toggle="collapse"
          href="#concours"
          :aria-expanded="
            isParentActive(['/edition-concours', '/resultats-concours', '/rapport-concours'])
          "
        >
          <i class="mdi mdi-trophy menu-icon"></i>
          <span class="menu-title">Concours</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{
            show: isParentActive(['/edition-concours', '/resultats-concours', '/rapport-concours']),
          }"
          id="concours"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/edition-concours">Editions</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/rapport-concours">Rapports</router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Inscriptions -->
      <li class="nav-item">
        <router-link class="nav-link" to="/inscriptions">
          <i class="mdi mdi-view-headline menu-icon"></i>
          <span class="menu-title">Inscriptions</span>
        </router-link>
      </li>

      <!-- Emploi du temps -->
      <li class="nav-item">
        <router-link class="nav-link" to="/schedule">
          <i class="mdi mdi-calendar-clock menu-icon"></i>
          <span class="menu-title">Emploi du temps</span>
        </router-link>
      </li>

      <!-- Finances -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            'active-parent': isParentActive([
              '/paiements',
              '/factures-finances',
              '/rapports-financiers',
            ]),
          }"
          data-bs-toggle="collapse"
          href="#finances"
          :aria-expanded="
            isParentActive(['/paiements', '/factures-finances', '/rapports-financiers'])
          "
        >
          <i class="mdi mdi-wallet menu-icon"></i>
          <span class="menu-title">Finances</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{
            show: isParentActive([
              '/paiements-finances',
              '/factures-finances',
              '/rapports-financiers',
            ]),
          }"
          id="finances"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/paiements-finances">Paiements & reçus</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/factures-finances">Facturations</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/rapports-financiers">Rapports</router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Affaires pédagogiques -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            'active-parent': isParentActive([
              '/enseignants',
              '/attribution-cours',
              '/crenaux-horaires',
              '/conges-replacement',
              '/programmes-credits',
            ]),
          }"
          data-bs-toggle="collapse"
          href="#pedagogique"
          :aria-expanded="
            isParentActive([
              '/enseignants',
              '/attribution-cours',
              '/crenaux-horaires',
              '/conges-replacement',
              '/programmes-credits',
            ])
          "
        >
          <i class="mdi mdi-school menu-icon"></i>
          <span class="menu-title">Affaires pédagogiques</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{
            show: isParentActive([
              '/enseignants',
              '/attribution-cours',
              '/crenaux-horaires',
              '/conges-replacement',
              '/programmes-credits',
            ]),
          }"
          id="pedagogique"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/enseignants">Enseignants</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/attribution-cours"
                >Attribution des cours</router-link
              >
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/crenaux-horaires">Creneaux / Horaires</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/conges-replacement"
                >Congés & remplacements</router-link
              >
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/programmes-credits"
                >Programmes / Crédits</router-link
              >
            </li>
          </ul>
        </div>
      </li>

      <!-- Bibliothèque -->
      <li class="nav-item">
        <router-link class="nav-link" to="/bibliotheque">
          <i class="mdi mdi-library menu-icon"></i>
          <span class="menu-title">Bibliothèque</span>
        </router-link>
      </li>

      <!-- Ressources matérielles -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            'active-parent': isParentActive(['/salles', '/reservation', '/disponibilites']),
          }"
          data-bs-toggle="collapse"
          href="#ressources"
          :aria-expanded="isParentActive(['/salles', '/reservation', '/disponibilites'])"
        >
          <i class="mdi mdi-database menu-icon"></i>
          <span class="menu-title">Ressources matérielles</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{ show: isParentActive(['/salles', '/reservation', '/disponibilites']) }"
          id="ressources"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/salles">Salles & équipements</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/reservation">Réservation</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/disponibilites">Disponibilités</router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Services -->
      <li class="nav-item">
        <router-link class="nav-link" to="/administration">
          <i class="mdi mdi-briefcase menu-icon"></i>
          <span class="menu-title">Services</span>
        </router-link>
      </li>

      <!-- Coordination académique -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            'active-parent': isParentActive(['/themes-memoires', '/soutenances', '/statut']),
          }"
          data-bs-toggle="collapse"
          href="#coordination"
          :aria-expanded="isParentActive(['/themes-memoires', '/soutenances', '/statut'])"
        >
          <i class="mdi mdi-clipboard-text menu-icon"></i>
          <span class="menu-title">Coordination académique</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{ show: isParentActive(['/themes-memoires', '/soutenances', '/statut']) }"
          id="coordination"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/themes-memoires">Thèmes & mémoires</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/soutenances">Soutenances</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/statut">Statut étudiant</router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Diplômes -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{
            'active-parent': isParentActive([
              '/demande-diplome',
              '/edition-diplome',
              '/historique-diplome',
            ]),
          }"
          data-bs-toggle="collapse"
          href="#diplomes"
          :aria-expanded="
            isParentActive(['/demande-diplome', '/edition-diplome', '/historique-diplome'])
          "
        >
          <i class="mdi mdi-certificate menu-icon"></i>
          <span class="menu-title">Diplômes</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{
            show: isParentActive(['/demande-diplome', '/edition-diplome', '/historique-diplome']),
          }"
          id="diplomes"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/demande-diplome">Demande de diplôme</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/edition-diplome"
                >Édition & certification</router-link
              >
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/historique-diplome">Historique</router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Courrier -->
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ 'active-parent': isParentActive(['/courriers', '/notes-admin', '/archivage']) }"
          data-bs-toggle="collapse"
          href="#courrier"
          :aria-expanded="isParentActive(['/courriers', '/notes-admin', '/archivage'])"
        >
          <i class="mdi mdi-email menu-icon"></i>
          <span class="menu-title">Courrier & Notes</span>
          <i class="menu-arrow"></i>
        </a>
        <div
          class="collapse"
          :class="{ show: isParentActive(['/courriers', '/notes-admin', '/archivage']) }"
          id="courrier"
        >
          <ul class="nav flex-column sub-menu">
            <li class="nav-item">
              <router-link class="nav-link" to="/courriers">Courriers</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/notes-admin">Notes administratives</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/archivage">Archivage</router-link>
            </li>
          </ul>
        </div>
      </li>

      <!-- Notifications -->
      <li class="nav-item">
        <router-link class="nav-link" to="/notification">
          <i class="mdi mdi-bell menu-icon"></i>
          <span class="menu-title">Notifications</span>
        </router-link>
      </li>

      <!-- Statistiques -->
      <li class="nav-item">
        <router-link class="nav-link" to="/statistiques">
          <i class="mdi mdi-chart-bar menu-icon"></i>
          <span class="menu-title">Statistiques</span>
        </router-link>
      </li>
      <!-- Assistant AI -->
      <li class="nav-item">
        <router-link class="nav-link" to="/assistant-ai">
          <i class="mdi mdi-robot menu-icon text-primary"></i>
          <span class="menu-title fw-bold">Assistant AI</span>
          <span class="badge badge-info ms-2 small" style="font-size: 10px">Beta</span>
        </router-link>
      </li>

      <!-- Paramètres -->
      <li class="nav-item">
        <router-link class="nav-link" to="/settings">
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

const isParentActive = (childRoutes) => {
  return childRoutes.some((routePath) => route.path.startsWith(routePath));
};
</script>

<style scoped>
.nav-link.active-parent {
  background-color: #f0f8ff;
  color: #4d83ff !important;
  font-weight: 600;
  border-left: 3px solid #4d83ff;
}

.sidebar .sub-menu .router-link-exact-active {
  color: #000 !important;
  font-weight: 600;
  background-color: #f8f9fa;
  border-left: 3px solid #000;
}

.nav-link.router-link-exact-active {
  color: #4d83ff !important;
  font-weight: 600;
  background-color: #f8f9fa;
  border-left: 3px solid #4d83ff;
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
</style>
