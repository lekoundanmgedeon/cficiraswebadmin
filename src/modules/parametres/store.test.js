import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('./api', () => ({
  getParametres: vi.fn(),
  putParametres: vi.fn(),
  getUtilisateurs: vi.fn(() => Promise.resolve({ data: { lignes: [], total: 0 } })),
  getRoles: vi.fn(() => Promise.resolve({ data: [] })),
  createUtilisateur: vi.fn(),
  updateUtilisateur: vi.fn(),
  setActif: vi.fn(),
  reinitialiserMotDePasse: vi.fn(),
  updateProfil: vi.fn(),
  changerMotDePasse: vi.fn(),
  getNotifications: vi.fn(),
  getNotificationsStats: vi.fn(),
  getDestinataires: vi.fn(),
  diffuserNotification: vi.fn(),
  supprimerNotification: vi.fn(),
  purgerNotifications: vi.fn(),
  getAuditFinancier: vi.fn(),
  getAuditResume: vi.fn(),
  getImports: vi.fn(),
}));

vi.mock('@/shared/stores/notificationStore', () => ({
  useNotificationStore: () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
    notifyWarning: vi.fn(),
  }),
}));

import { formatMontant } from '@/shared/utils/parametres';
import { getParametres, getUtilisateurs, putParametres } from './api';
import { useParametresStore } from './store';

/** La réponse type de `GET /parametres`. */
const catalogue = (surcharge = []) => ({
  data: {
    total: 2,
    categories: [
      {
        categorie: 'etablissement',
        parametres: [
          {
            cle: 'etablissement.nom',
            valeur: 'Institut X',
            type_valeur: 'texte',
            categorie: 'etablissement',
            libelle: "Nom de l'établissement",
            modifiable: true,
          },
        ],
      },
      {
        categorie: 'finances',
        parametres: [
          {
            cle: 'finances.devise_symbole',
            valeur: '€',
            type_valeur: 'texte',
            categorie: 'finances',
            libelle: 'Symbole de la devise',
            modifiable: true,
          },
        ],
      },
      ...surcharge,
    ],
  },
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('Chargement des réglages', () => {
  it('aplatit le catalogue en couples clé/valeur', () => {
    const store = useParametresStore();
    store.categories = catalogue().data.categories;

    expect(store.valeurs).toEqual({
      'etablissement.nom': 'Institut X',
      'finances.devise_symbole': '€',
    });
  });

  it('dépose les valeurs dans `shared/utils/parametres`', async () => {
    // C'est ce dépôt qui rend les réglages lisibles **hors composant** :
    // `exportPDF` et les formateurs de montants vivent dans `shared`, qui ne
    // peut pas importer un module (règle `modules → shared → core`).
    const store = useParametresStore();
    getParametres.mockResolvedValue(catalogue());

    await store.fetchParametres();

    // Espace fine insécable (U+202F) : c'est ce que rend `Intl` en fr-FR.
    expect(formatMontant(1500)).toBe('1\u202f500 €');
  });

  it('rend les paramètres d’une catégorie, et un tableau vide sinon', () => {
    const store = useParametresStore();
    store.categories = catalogue().data.categories;

    expect(store.parametresDe('finances')).toHaveLength(1);
    expect(store.parametresDe('inexistante')).toEqual([]);
  });
});

describe('Enregistrement des réglages', () => {
  it('relit le catalogue après écriture, pour ne pas deviner l’auteur ni la date', async () => {
    const store = useParametresStore();
    putParametres.mockResolvedValue({ data: [] });
    getParametres.mockResolvedValue(catalogue());

    await store.enregistrerParametres({ 'etablissement.nom': 'Institut Y' });

    expect(putParametres).toHaveBeenCalledWith({ 'etablissement.nom': 'Institut Y' });
    expect(getParametres).toHaveBeenCalled();
  });

  it('redépose la devise dans `shared` après enregistrement', async () => {
    // Sans ce second dépôt, changer le symbole n'aurait d'effet qu'au
    // rechargement de la page — ce qui se lit comme un enregistrement raté.
    const store = useParametresStore();
    putParametres.mockResolvedValue({ data: [] });
    getParametres.mockResolvedValue(catalogue());

    await store.enregistrerParametres({ 'finances.devise_symbole': '€' });

    expect(formatMontant(200)).toBe('200 €');
  });

  it('n’écrase rien quand le serveur refuse', async () => {
    const store = useParametresStore();
    putParametres.mockRejectedValue(new Error('400'));

    const resultat = await store.enregistrerParametres({ 'x.y': 'z' });

    // `run()` rend `undefined` en cas d'échec : l'UI s'y fie pour ne pas fermer
    // un formulaire dont la saisie n'est pas passée.
    expect(resultat).toBeUndefined();
    expect(getParametres).not.toHaveBeenCalled();
  });
});

describe('Filtres de la liste des comptes', () => {
  it('ne transmet pas les filtres vides', async () => {
    // Une chaîne vide sur `actif` ferait filtrer sur les comptes désactivés, le
    // serveur lisant `'' !== 'true'`.
    const store = useParametresStore();

    await store.fetchUtilisateurs();

    const params = getUtilisateurs.mock.calls[0][0];
    expect(params.q).toBeUndefined();
    expect(params.role).toBeUndefined();
    expect(params.actif).toBeUndefined();
  });

  it('transmet les filtres renseignés', async () => {
    const store = useParametresStore();
    store.recherche = '  admin  ';
    store.filtreRole = 'ADMIN';
    store.filtreActif = 'false';

    await store.fetchUtilisateurs();

    expect(getUtilisateurs.mock.calls[0][0]).toMatchObject({
      q: 'admin',
      role: 'ADMIN',
      actif: 'false',
    });
  });
});
