import { hasToken } from '@/core/auth/tokenStorage';
import { ESPACE_NOTES_BASE } from './constants';

/**
 * Routes de l'espace de gestion des notes.
 *
 * Elles sont montées **hors du layout applicatif** (voir `core/router/index.js`) :
 * l'espace s'ouvre dans une fenêtre minimale, sans en-tête ni menu de
 * l'application. Il porte sa propre coquille, sa propre session, et sa propre
 * garde de navigation.
 *
 * La garde générale (`core/router/guards.js`) renvoie vers `Login`, l'écran de
 * connexion de l'application : dans cette fenêtre, ce serait la mauvaise porte.
 * D'où le `beforeEnter` ci-dessous, qui renvoie vers la connexion de l'espace —
 * et le `meta.public` sur le parent, qui écarte la garde générale sans rien
 * ouvrir : chaque enfant protégé passe par `exigerSessionEspace`.
 */

/** @param {import('vue-router').RouteLocationNormalized} to */
function exigerSessionEspace(to) {
  if (hasToken()) return true;
  return { name: 'EspaceNotesConnexion', query: { redirect: to.fullPath } };
}

export default [
  {
    path: ESPACE_NOTES_BASE,
    // `public` vaut ici « la garde générale ne s'en occupe pas » : la
    // protection est assurée route par route, par `exigerSessionEspace`.
    meta: { public: true },
    children: [
      {
        path: 'connexion',
        name: 'EspaceNotesConnexion',
        component: () => import('./views/ConnexionView.vue'),
        meta: { public: true, title: 'Connexion' },
      },
      {
        path: '',
        component: () => import('./layouts/EspaceNotesLayout.vue'),
        meta: { public: true },
        children: [
          {
            path: '',
            name: 'EspaceNotesTableauBord',
            component: () => import('./views/TableauBordView.vue'),
            beforeEnter: exigerSessionEspace,
            meta: { public: true, title: 'Tableau de bord' },
          },
          {
            path: 'grilles',
            name: 'EspaceNotesGrille',
            component: () => import('./views/GrilleNotesView.vue'),
            beforeEnter: exigerSessionEspace,
            meta: { public: true, title: 'Grilles de notes' },
          },
          {
            path: 'moyennes',
            name: 'EspaceNotesMoyennes',
            component: () => import('./views/MoyennesView.vue'),
            beforeEnter: exigerSessionEspace,
            meta: { public: true, title: 'Moyennes & bulletins' },
          },
        ],
      },
    ],
  },
];
