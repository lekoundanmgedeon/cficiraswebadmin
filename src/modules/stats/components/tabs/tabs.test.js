// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as api from '../../api';
import { useStatsStore } from '../../store';
import SyntheseTab from './SyntheseTab.vue';
import ClassesTab from './ClassesTab.vue';
import PalmaresTab from './PalmaresTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const destroy = vi.fn();
vi.mock('chart.js/auto', () => ({
  default: class {
    constructor(canvas, config) {
      this.config = config;
    }
    destroy = destroy;
  },
}));

const STATS = {
  success: true,
  data: {
    synthese: {
      effectif: 3,
      moyenne: '12.40',
      moyenne_min: '8.00',
      moyenne_max: '15.50',
      admis: 2,
      rattrapages: 1,
      publies: 0,
      credits_acquis: 18,
    },
    distribution: [{ tranche: '[12-14[', effectif: 1 }],
    decisions: [
      { decision: 'VALIDE', effectif: 2 },
      { decision: 'RATTRAPAGE', effectif: 1 },
    ],
    mentions: [{ mention: 'TRES_BIEN', effectif: 1 }],
    parClasse: [
      {
        classe_id: 'c1',
        classe_code: 'GI-L1',
        filiere: 'Génie Informatique',
        effectif: 2,
        moyenne: '13.95',
        admis: 2,
      },
    ],
  },
};

const STATS_VIDE = {
  success: true,
  data: {
    synthese: {
      effectif: 0,
      moyenne: null,
      moyenne_min: null,
      moyenne_max: null,
      admis: 0,
      rattrapages: 0,
      publies: 0,
      credits_acquis: 0,
    },
    distribution: [],
    decisions: [],
    mentions: [],
    parClasse: [],
  },
};

describe('onglets des statistiques de résultats', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('SyntheseTab', () => {
    it('affiche les chiffres du serveur', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS);
      const store = useStatsStore();
      await store.fetchStatistiques();

      const wrapper = mount(SyntheseTab);
      await flushPromises();

      const texte = wrapper.text();
      expect(texte).toContain('12.40/20');
      expect(texte).toContain('66.7 %'); // 2 admis sur 3
      expect(texte).toContain('de 8.00/20 à 15.50/20');
      expect(texte).toContain('Très bien');
      expect(texte).toContain('Rattrapage');
    });

    it('affiche « — » plutôt que NaN sur un périmètre vide', async () => {
      // `AVG` d'un ensemble vide vaut `null` : le formater comme un nombre
      // produirait « NaN/20 », c'est-à-dire une note inventée.
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      const store = useStatsStore();
      await store.fetchStatistiques();

      const wrapper = mount(SyntheseTab);
      await flushPromises();

      expect(wrapper.text()).not.toContain('NaN');
      expect(wrapper.text()).toContain('—');
      expect(wrapper.text()).toContain('Aucun bulletin calculé');
    });

    it('détruit son graphique au démontage', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS);
      const store = useStatsStore();
      await store.fetchStatistiques();

      const wrapper = mount(SyntheseTab, { attachTo: document.body });
      await flushPromises();
      wrapper.unmount();

      expect(destroy).toHaveBeenCalled();
    });

    it('distingue « aucune mention » de « données manquantes »', async () => {
      // Une mention n'est décernée qu'au-dessus de la moyenne : une liste vide
      // veut dire que personne ne l'a, pas que l'information manque.
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue({
        success: true,
        data: { ...STATS.data, mentions: [] },
      });
      const store = useStatsStore();
      await store.fetchStatistiques();

      const wrapper = mount(SyntheseTab);
      await flushPromises();

      expect(wrapper.text()).toContain('Aucune mention décernée');
    });
  });

  describe('ClassesTab', () => {
    it('affiche le taux de réussite de chaque classe', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS);
      const store = useStatsStore();
      await store.fetchStatistiques();

      const wrapper = mount(ClassesTab);
      await flushPromises();

      const texte = wrapper.text();
      expect(texte).toContain('GI-L1');
      expect(texte).toContain('Génie Informatique');
      expect(texte).toContain('13.95/20');
      expect(texte).toContain('100.0%'); // 2 admis sur 2
    });
  });

  describe('PalmaresTab', () => {
    it('explique pourquoi il est vide quand le périmètre est partiel', async () => {
      // La route répond 400 sans le triplet : le dire vaut mieux qu'un tableau
      // vide sans raison apparente.
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      const espion = vi.spyOn(api, 'getBulletinsClasse');
      const store = useStatsStore();
      await store.appliquerFiltres({ classeId: 'c1' });

      const wrapper = mount(PalmaresTab);
      await flushPromises();

      expect(wrapper.text()).toContain('Sélectionnez un périmètre complet');
      expect(espion).not.toHaveBeenCalled();
    });

    it('rend le palmarès nominatif', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      vi.spyOn(api, 'getBulletinsClasse').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'b1',
            matricule: 'ETU-2024-001',
            nom: 'DIALLO',
            prenom: 'Amadou',
            moyenne_generale: '15.50',
            rang_etudiant: '1',
            credits_acquis: '6',
            credits_totaux_semestre: 18,
            decision: 'VALIDE',
            mention: 'TRES_BIEN',
          },
        ],
      });

      const store = useStatsStore();
      await store.appliquerFiltres({ classeId: 'c1', semestreId: 's1', anneeId: 'a1' });

      const wrapper = mount(PalmaresTab);
      await flushPromises();

      const texte = wrapper.text();
      expect(texte).toContain('DIALLO Amadou');
      expect(texte).toContain('ETU-2024-001');
      expect(texte).toContain('15.50/20');
      expect(texte).toContain('6 / 18');
      expect(texte).toContain('Validé');
      expect(texte).toContain('Très bien');
    });

    it('affiche un tiret quand la mention est nulle', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      vi.spyOn(api, 'getBulletinsClasse').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'b2',
            matricule: 'ETU-2024-002',
            nom: 'BA',
            prenom: 'Fatou',
            moyenne_generale: '8.00',
            rang_etudiant: '2',
            credits_acquis: '0',
            credits_totaux_semestre: 18,
            decision: 'RATTRAPAGE',
            mention: null,
          },
        ],
      });

      const store = useStatsStore();
      await store.appliquerFiltres({ classeId: 'c1', semestreId: 's1', anneeId: 'a1' });

      const wrapper = mount(PalmaresTab);
      await flushPromises();

      expect(wrapper.text()).not.toContain('null');
      expect(wrapper.text()).toContain('Rattrapage');
    });
  });
});
