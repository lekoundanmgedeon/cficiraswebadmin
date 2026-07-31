/**
 * Routes du guichet des documents administratifs.
 *
 * Trois menus existaient dans `main` — `/demande-diplome`, `/edition-diplome`,
 * `/historique-diplome` — et **aucun ne pointait vers quoi que ce soit**. Ils
 * deviennent un écran unique à trois onglets : le circuit d'une demande est le
 * même, seule sa position change.
 *
 * Les anciennes URL sont conservées en redirection : un signet ou un lien
 * envoyé par courriel continue de fonctionner.
 */
export default [
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('./views/DocumentsView.vue'),
    meta: { title: 'Diplômes & documents' },
  },
  { path: '/demande-diplome', redirect: { name: 'Documents' } },
  { path: '/edition-diplome', redirect: { name: 'Documents' } },
  { path: '/historique-diplome', redirect: { name: 'Documents' } },
];
