import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDashboardStore } from './store';
import * as api from './api';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Réponses réelles, relevées contre `localhost:3500` le 27/07/2026.
 *
 * Le point que ces tests verrouillent : **tous les compteurs arrivent en
 * chaînes**. `pg` sert ainsi ses `COUNT` et ses `SUM`. Sans conversion,
 * `inscrits / capacite` fonctionne par coercition mais `a + b` concatène, et
 * Chart.js reçoit des étiquettes au lieu de valeurs — l'axe reste vide sans
 * qu'aucune erreur ne soit levée.
 */
const INFRASTRUCTURE_RESPONSE = {
  success: true,
  data: {
    total_classes: '10',
    capacite_totale_etablissement: '1610',
    total_etudiants_inscrits: '26',
    places_disponibles_globales: '1584',
  },
  meta: { count: 1 },
};

const CYCLES_RESPONSE = {
  success: true,
  data: [
    { cycle_id: '2600', cycle_code: 'ING', diplome: "Diplôme d'Ingénieur", nb_etudiants: '0' },
    { cycle_id: '67a1', cycle_code: 'LMD-L', diplome: 'Licence', nb_etudiants: '26' },
    { cycle_id: '4cb4', cycle_code: 'LMD-M', diplome: 'Master', nb_etudiants: '0' },
  ],
  meta: { count: 3 },
};

const FILIERES_RESPONSE = {
  success: true,
  data: [
    {
      id: 'd9fd',
      filiere: 'Electricite',
      responsable: 'Non assigné',
      effectif: '0',
      capacite: '60',
      taux: '0.00',
      statut: 'VIDE',
    },
    {
      id: '2365',
      filiere: 'Génie Informatique',
      responsable: 'Non assigné',
      effectif: '9',
      capacite: '500',
      taux: '1.80',
      statut: 'OUVERTE',
    },
  ],
  meta: { count: 2 },
};

describe('dashboardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  describe('conversion des compteurs servis en chaînes', () => {
    it('convertit les KPI d’infrastructure en nombres', async () => {
      vi.spyOn(api, 'getInfrastructureKpi').mockResolvedValue(INFRASTRUCTURE_RESPONSE);
      const store = useDashboardStore();

      await store.fetchInfrastructure();

      expect(store.infrastructure).toEqual({
        total_classes: 10,
        capacite_totale_etablissement: 1610,
        total_etudiants_inscrits: 26,
        places_disponibles_globales: 1584,
      });
      // Une addition, et non une concaténation : c'est tout l'enjeu.
      expect(store.infrastructure.total_classes + 1).toBe(11);
    });

    it('convertit les effectifs de cycle en nombres', async () => {
      vi.spyOn(api, 'getDistributionCycles').mockResolvedValue(CYCLES_RESPONSE);
      const store = useDashboardStore();

      await store.fetchCycles();

      expect(store.cycles.map((cycle) => cycle.nb_etudiants)).toEqual([0, 26, 0]);
    });

    it('convertit effectif, capacité et taux des filières', async () => {
      vi.spyOn(api, 'getOrganisationFilieres').mockResolvedValue(FILIERES_RESPONSE);
      const store = useDashboardStore();

      await store.fetchFilieres();

      expect(store.filieres[1]).toMatchObject({ effectif: 9, capacite: 500, taux: 1.8 });
    });
  });

  describe('getters', () => {
    it('calcule le taux de remplissage', async () => {
      vi.spyOn(api, 'getInfrastructureKpi').mockResolvedValue(INFRASTRUCTURE_RESPONSE);
      const store = useDashboardStore();

      await store.fetchInfrastructure();

      expect(store.tauxRemplissage).toBeCloseTo((26 / 1610) * 100, 5);
    });

    it('ne divise pas par zéro quand aucune capacité n’est déclarée', () => {
      const store = useDashboardStore();

      // État initial : capacité à 0. Sans garde, le getter renvoie NaN et la
      // barre de progression disparaît.
      expect(store.tauxRemplissage).toBe(0);
    });

    it('écarte les cycles vides du graphique', async () => {
      vi.spyOn(api, 'getDistributionCycles').mockResolvedValue(CYCLES_RESPONSE);
      const store = useDashboardStore();

      await store.fetchCycles();

      expect(store.cyclesPeuples.map((cycle) => cycle.cycle_code)).toEqual(['LMD-L']);
    });

    it('trie les filières par effectif décroissant sans muter l’état', async () => {
      vi.spyOn(api, 'getOrganisationFilieres').mockResolvedValue(FILIERES_RESPONSE);
      const store = useDashboardStore();

      await store.fetchFilieres();

      expect(store.filieresParEffectif.map((f) => f.filiere)).toEqual([
        'Génie Informatique',
        'Electricite',
      ]);
      // L'ordre d'origine du state est préservé : le getter copie avant de trier.
      expect(store.filieres.map((f) => f.filiere)).toEqual(['Electricite', 'Génie Informatique']);
    });
  });

  describe('gestion des échecs', () => {
    it('laisse l’état intact et expose l’erreur quand la lecture échoue', async () => {
      const echec = new Error('boom');
      vi.spyOn(api, 'getDistributionCycles').mockRejectedValue(echec);
      const store = useDashboardStore();

      const resultat = await store.fetchCycles();

      // Contrat central du projet : `run()` rend `undefined` en cas d'échec.
      expect(resultat).toBeUndefined();
      expect(store.cycles).toEqual([]);
      expect(store.error).toBe(echec);
      expect(store.loading).toBe(false);
    });
  });
});
