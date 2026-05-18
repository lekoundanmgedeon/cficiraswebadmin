import { createRouter, createWebHistory } from 'vue-router';

// Importer le layout global
import DefaultLayout from '../layouts/DefaultLayout.vue'; // Importer le layout global
//page  d'accueil
import Home from '../views/dashboard/Dashboard.vue'; // Page d'accueil
import Login from '../views/auth/Login.vue'; // Page de login
import Register from '../views/auth/Register.vue'; // Page de login

// Structure academique
import AnneeAcademiqueHeader from '@/views/stracad/anneeac/AnneeAcademique.vue';
import CyclesAcademiqueHeader from '@/views/stracad/cycles/Cycle.vue';
import FiliereHeader from '@/views/stracad/filieres/Filiere.vue';
import Classes from '@/views/stracad/classes/Classes.vue';
import Semestre from '@/views/stracad/semestres/Semestre.vue';
//Tableau de bord
import Dashboard from '../views/dashboard/Dashboard.vue'; // Page du tableau de bord
// Notification
import NotificationView from '../views/notifications/notification.vue';
import Statistique from '../views/stats/Statistiques.vue'; // Page des statistiques
import Documentation from '../views/docf/Document.vue'; // Page de la documentation

// Inscriptions et admissions
import Inscription from '../views/inscriptions/Inscription.vue';
// Planification des cours et emplois du temps
import Schedule from '../views/schedule/Schedule.vue';
// Etudiants et gestion des étudiants (Details)
import Etudiants from '../views/etudiants/Etudiants.vue';
//Modules et matières

import Modules from '../views/matieres/Modules.vue';

//Planification des examens
import Examens from '../views/examens/Examens.vue';
import Planning from '../views/examens/calendrier/sample.vue';
import DetailExamen from '../views/examens/calendrier/detail/DetailExamen.vue'; // Détails des examens
import Calendrier from '../views/examens/calendrier/Calendrier.vue'; // Calendrier des examens
import Plannification from '../views/examens/planification/Planification.vue'; // Planification des examens
import Salles from '../views/examens/salles/Salles.vue'; // Salles d'examen
import RapportExamens from '../views/examens/rapports/RapportExamens.vue'; // Rapport des examens

//Gestion des concours
import EditionConcours from '../views/concours/editions/Edition.vue';
import RapportConcours from '../views/concours/resultats/RapportConcours.vue';
import DetailsConcours from '../views/concours/editions/components/details/Details.vue';
import ResultatsDetails from '../views/concours/editions/components/details/Details.vue'; // Résultats des concours
//Notes et résultats
import ResultatsConcours from '../views/concours/resultats/RapportConcours.vue'; // Résultats des concours

//Paiements et finances

import Notes from '../views/notes/Notes.vue'; // Page des notes
import appNotes from '../views/notes/addNotes/main/notev1.vue';
//Parcours et filières
import Parcours from '../views/parcours/DossierAcademique.vue';
// Cours et supports
import Support from '../views/support/Support.vue';
//Paramètres et configurations
import Settings from '../views/settings/Settings.vue';
//Formateurs et enseignants
import Formateur from '../views/pedagogies/formateurs/Enseignants.vue';
import attributionCours from '@/views/pedagogies/attributions/AttributionCours.vue';
import CrenauxHorraire from '@/views/pedagogies/crenaux/CrenauHoraire.vue'
//Administration et gestion
import Admins from '../views/admin/Administration.vue';
//Finances et paiements
import FinancePaiement from '../views/finances/paiements/Paiements.vue';
import FinanceFacture from '../views/finances/facturations/Facturation.vue';
import FinanceRapport from '../views/finances/rapports/RapportFinances.vue';

// Assistant IA
import AssistantAi from '@/views/prompt/AssistantAi.vue';

//PAGE  Not Found (ERREUR 404)
import NotFound from '../views/errors/NotFound.vue';

const routes = [
  // Route de login (pas besoin de layout global ici)
  { path: '/auth/login', name: 'Login', component: Login, meta: { public: true } },
  { path: '/auth/register', name: 'Register', component: Register, meta: { public: true } },
  { path: '/auth/new-password', name: 'NewPassword', component: Login, meta: { public: true } },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound, meta: { public: true } },
  { path: '/addNotes', name: 'appNotes', component: appNotes },
  // Routes qui utilisent le layout global DefaultLayout
  {
    path: '/',
    component: DefaultLayout, // Enveloppe tout le contenu avec le DefaultLayout
    linkActiveClass: 'active', // remplace router-link-active
    linkExactActiveClass: 'active', // remplace router-link-exact-active
    meta: { requiresAuth: true }, // Toutes les routes enfants hériteront de ce meta
    children: [
      { path: '', name: 'root', component: Home },
      { path: '/home', name: 'Home', component: Home },
      { path: '/dashboard', name: 'Dashboard', component: Dashboard }, // Tableau de bord
      { path: '/statistiques', name: 'Statistique', component: Statistique }, // Statistiques
      { path: '/documentation', name: 'Documentations', component: Documentation },
      { path: '/inscriptions', name: 'Inscriptions', component: Inscription },
      { path: '/schedule', name: 'Schedule', component: Schedule },
      { path: '/etudiants', name: 'Etudiants', component: Etudiants },
      {
        path: '/etudiants/:id',
        name: 'EtudiantDetails',
        component: () => import('@/views/etudiants/components/details/DetailEtudiant.vue'),
        props: true,
      },
      { path: '/modules', name: 'Modules', component: Modules },
      {
        path: '/modules/:id',
        name: 'ModuleDetails',
        component: () => import('@/views/matieres/details/DetailsPanel.vue'),
        props: true,
      },
      { path: '/notes', name: 'Notes', component: Notes },
      { path: '/dossiers-scolaires', name: 'dossiers-scolaires', component: Parcours },
      { path: '/supcours', name: 'Support', component: Support },
      { path: '/settings', name: 'Settings', component: Settings },
      { path: '/enseignants', name: 'Formateur', component: Formateur },
      { path: '/attribution-cours', name: 'AttributionsCours', component: attributionCours },
      { path: '/crenaux-horaires', name: 'CrenauxHoraire', component: CrenauxHorraire },
      { path: '/administration', name: 'Administration', component: Admins },
      { path: '/paiements-finances', name: 'FinancePaiement', component: FinancePaiement },
      { path: '/factures-finances', name: 'FinanceFacture', component: FinanceFacture },
      { path: '/factures-finances', name: 'FinanceFacture', component: FinanceFacture },
      { path: '/rapports-financiers', name: 'RapportsFinanciers', component: FinanceRapport },
      { path: '/assistant-ai', name: 'AssistantAI', component: AssistantAi },

      { path: '/notification', name: 'Notification', component: NotificationView },

      { path: '/examens', name: 'Examens', component: Examens },
      { path: '/examens/planning/:id', name: 'Planning', component: Planning, props: true },
      {
        path: '/examens/planning/:id/calendrier/:semestreId',
        name: 'Calendrier',
        component: DetailExamen,
        props: true,
      },
      { path: '/edition-concours', name: 'InscriptionConcours', component: EditionConcours },
      { path: '/rapport-concours', name: 'RapportConcours', component: RapportConcours },
      { path: '/resultats-concours', name: 'ResultatsConcours', component: ResultatsConcours },
      { path: '/edition-concours/edit/:id', name: 'EditionConcours', component: DetailsConcours },
      { path: '/resultats-concours/:id', name: 'ResultatsDetails', component: ResultatsDetails },

      { path: '/planification-examens', name: 'Planification', component: Plannification },
      { path: '/calendrier-examens', name: 'CalendrierExamens', component: Calendrier },
      { path: '/salles-horaires', name: 'SallesExamens', component: Salles },
      { path: '/rapport-examens', name: 'RapportExamens', component: RapportExamens },
      {
        path: '/annees-academiques',
        name: 'AnneeAcademiqueHeader',
        component: AnneeAcademiqueHeader,
      },
      {
        path: '/cycles-academiques',
        name: 'CyclesAcademiqueHeader',
        component: CyclesAcademiqueHeader,
      },
      {
        path: '/filieres-academiques',
        name: 'FiliereHeader',
        component: FiliereHeader,
      },
      {
        path: '/classes-niveaux',
        name: 'ClassesNiveaux',
        component: Classes,
      },
      {
        path: '/semestres',
        name: 'Semestres',
        component: Semestre,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard global: protège les routes qui nécessitent une authentification
/*
router.beforeEach((to, from, next) => {
  const isPublic = to.matched.some((record) => record.meta && record.meta.public);
  const isLoggedIn = !!localStorage.getItem('token');

  if (!isPublic && !isLoggedIn) {
    return next({ path: '/auth/login', query: { redirect: to.fullPath } });
  }

  // Redirige un utilisateur connecté loin des pages d'auth
  if (isLoggedIn && to.path.startsWith('/auth')) {
    return next('/');
  }

  return next();
});
*/
export default router;
