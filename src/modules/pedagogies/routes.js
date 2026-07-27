/**
 * Routes du module Pédagogie.
 *
 * La migration se fait écran par écran : chaque route quitte l'ancien
 * `src/routes/pedagogie.routes.js` pour ce fichier au fur et à mesure que son
 * écran est branché sur le backend réel. Chemins et noms **inchangés**, pour ne
 * pas toucher à la barre latérale.
 *
 * Module complet (4 écrans) : formateurs (répertoire), crenaux (emplois du
 * temps), attributions (cours → enseignants), programme (maquette & crédits).
 */
export default [
  {
    path: '/enseignants',
    name: 'Formateur',
    component: () => import('./formateurs/views/EnseignantsView.vue'),
    meta: { title: 'Formateurs' },
  },
  {
    path: '/crenaux-horaires',
    name: 'CrenauxHoraire',
    component: () => import('./crenaux/views/CrenauHoraireView.vue'),
    meta: { title: 'Créneaux & horaires' },
  },
  {
    path: '/attribution-cours',
    name: 'AttributionsCours',
    component: () => import('./attributions/views/AttributionCoursView.vue'),
    meta: { title: 'Attribution des cours' },
  },
  {
    path: '/programmes-credits',
    name: 'ProgrammesCredits',
    component: () => import('./programme/views/ProgrammeCreditView.vue'),
    meta: { title: 'Programmes & crédits' },
  },
  {
    // La barre latérale pointait déjà vers `/schedule`, mais **aucune route ne
    // portait ce chemin** : le lien menait à la page « introuvable ».
    path: '/schedule',
    name: 'EmploiDuTemps',
    component: () => import('./emploi-du-temps/views/EmploiDuTempsView.vue'),
    meta: { title: 'Emploi du temps' },
  },
];
