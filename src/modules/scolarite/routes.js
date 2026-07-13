/**
 * Routes du module Scolarité.
 *
 * La route `/absences` a **disparu**. L'écran qu'elle servait
 * (`views/absence/AbscenceView.vue`) était intégralement simulé : son
 * `validerFeuilleAppel` construisait un payload, l'écrivait dans la console,
 * attendait une seconde puis affichait « Fiche d'émargement enregistrée avec
 * succès ! » — **sans jamais rien envoyer**. Et pour cause : aucune route
 * d'absence n'existe dans le backend. Voir §2.5 du point de reprise.
 *
 * `/dossiers-scolaires/:id/global-informations` se simplifie en
 * `/dossiers-scolaires/:id`.
 */
export default [
  {
    path: '/dossiers-scolaires',
    name: 'DossiersScolaires',
    component: () => import('./views/DossiersView.vue'),
    meta: { title: 'Dossiers scolaires' },
  },
  {
    path: '/dossiers-scolaires/:id',
    name: 'DossierScolaire',
    component: () => import('./views/DossierDetailView.vue'),
    props: true,
    meta: { title: 'Dossier scolaire' },
  },
];
