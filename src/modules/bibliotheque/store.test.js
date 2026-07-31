import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBibliothequeStore } from './store';
import * as api from './api';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/** Charge utile de `v_ouvrages_catalogue` : `disponibilite` est dérivée en base. */
const OUVRAGES = {
  success: true,
  data: [
    {
      id: 'o1',
      cote: 'INFO-001',
      titre: 'Algorithmique',
      auteur: 'Cormen',
      categorie: 'Informatique',
      type_ouvrage: 'LIVRE',
      nb_exemplaires: 4,
      nb_disponibles: 2,
      nb_sortis: 2,
      disponibilite: 'PARTIEL',
    },
    {
      id: 'o2',
      cote: 'MATH-002',
      titre: 'Analyse réelle',
      auteur: 'Rudin',
      categorie: 'Mathématiques',
      type_ouvrage: 'LIVRE',
      nb_exemplaires: 2,
      nb_disponibles: 0,
      nb_sortis: 2,
      disponibilite: 'INDISPONIBLE',
    },
    {
      id: 'o3',
      cote: 'REV-001',
      titre: 'Revue de génie civil',
      auteur: 'Collectif',
      categorie: null,
      type_ouvrage: 'REVUE',
      nb_exemplaires: 3,
      nb_disponibles: 3,
      nb_sortis: 0,
      disponibilite: 'DISPONIBLE',
    },
  ],
};

/** `v_memoires_archives` : soutenus, publiés ou non. */
const MEMOIRES = {
  success: true,
  data: [
    {
      id: 't1',
      theme: 'Détection d’intrusion',
      type_travail: 'MEMOIRE',
      est_publie: true,
      cote_bibliotheque: 'MEM-2026-001',
      etudiant_nom: 'BAVOGUI',
      date_publication: '2026-07-01',
    },
    {
      id: 't2',
      theme: 'Ordonnancement',
      type_travail: 'MEMOIRE',
      est_publie: false,
      cote_bibliotheque: null,
      etudiant_nom: 'CAMARA',
      date_publication: null,
    },
  ],
};

describe('catalogue de la bibliothèque', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const charger = async () => {
    vi.spyOn(api.ouvragesResource, 'list').mockResolvedValue(OUVRAGES);
    vi.spyOn(api, 'getMemoires').mockResolvedValue(MEMOIRES);

    const store = useBibliothequeStore();
    await Promise.all([store.fetchAll(), store.fetchMemoires()]);
    return store;
  };

  it('cumule le fonds sans confondre exemplaires et titres', async () => {
    const store = await charger();

    expect(store.indicateurs).toEqual({
      nbTitres: 3,
      exemplaires: 9,
      disponibles: 5,
      sortis: 4,
      nbMemoires: 2,
    });
  });

  it('repère les titres dont plus aucun exemplaire n’est en rayon', async () => {
    const store = await charger();

    expect(store.indisponibles.map((o) => o.cote)).toEqual(['MATH-002']);
  });

  it('ne propose au filtre que les catégories réellement présentes', async () => {
    const store = await charger();

    // La revue n'a pas de catégorie : elle ne doit pas produire une entrée vide.
    expect(store.categories).toEqual(['Informatique', 'Mathématiques']);
  });

  it('garde les mémoires à part du catalogue', async () => {
    const store = await charger();

    // Un mémoire n'est pas un ouvrage acquis : le recopier dans `items`
    // créerait deux titres pour un même document, libres de diverger.
    expect(store.items.map((o) => o.id)).not.toContain('t1');
    expect(store.memoires).toHaveLength(2);
    expect(store.memoiresPublies.map((m) => m.cote_bibliotheque)).toEqual(['MEM-2026-001']);
  });

  it('ne compte rien quand le fonds est vide', async () => {
    vi.spyOn(api.ouvragesResource, 'list').mockResolvedValue({ success: true, data: [] });

    const store = useBibliothequeStore();
    await store.fetchAll();

    expect(store.indicateurs.exemplaires).toBe(0);
    expect(store.categories).toEqual([]);
    expect(Number.isNaN(store.indicateurs.disponibles)).toBe(false);
  });
});
