// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as dashboardApi from '../../api';
import VueEnsembleTab from './VueEnsembleTab.vue';
import CyclesTab from './CyclesTab.vue';
import PedagogiesTab from './PedagogiesTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Chart.js touche au canvas, que jsdom n'implémente pas. On le remplace par un
 * double : ces tests portent sur **ce que l'écran affiche**, pas sur le rendu
 * du graphique. Le double vérifie tout de même que `destroy()` est appelé —
 * une instance non détruite fuit à chaque changement d'onglet.
 */
const destroy = vi.fn();
vi.mock('chart.js/auto', () => ({
  default: class {
    constructor(canvas, config) {
      this.config = config;
    }
    destroy = destroy;
  },
}));

const INFRASTRUCTURE = {
  success: true,
  data: {
    total_classes: '10',
    capacite_totale_etablissement: '1610',
    total_etudiants_inscrits: '26',
    places_disponibles_globales: '1584',
  },
};

const CYCLES = {
  success: true,
  data: [
    { cycle_id: '1', cycle_code: 'ING', diplome: "Diplôme d'Ingénieur", nb_etudiants: '0' },
    { cycle_id: '2', cycle_code: 'LMD-L', diplome: 'Licence', nb_etudiants: '26' },
  ],
};

const FILIERES = {
  success: true,
  data: [
    {
      id: 'a',
      filiere: 'Electricite',
      responsable: 'Non assigné',
      effectif: '0',
      capacite: '60',
      taux: '0.00',
      statut: 'VIDE',
    },
    {
      id: 'b',
      filiere: 'Génie Informatique',
      responsable: 'Non assigné',
      effectif: '9',
      capacite: '500',
      taux: '1.80',
      statut: 'OUVERTE',
    },
  ],
};

/** Charge utile réelle de `vue_attributions_cours`. */
const ATTRIBUTIONS = {
  success: true,
  data: [
    {
      attribution_id: '7c13',
      classe: 'GI-L1',
      module_code: 'ALG1',
      matiere: 'Algorithmique',
      formateur: 'Jean KOUMA',
      semestre: 'S1',
      heures: 50,
    },
  ],
};

const ENSEIGNANTS = {
  success: true,
  data: [{ enseignant_id: '6e01' }, { enseignant_id: '6e02' }],
};

/**
 * `Intl.NumberFormat('fr-FR')` sépare les milliers par une **espace fine
 * insécable** (U+202F), et non par une espace ordinaire : `'1 610'` écrit au
 * clavier ne correspond pas à ce que rend le composant. On normalise donc
 * toutes les espaces avant de comparer.
 */
const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglets du tableau de bord', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('VueEnsembleTab', () => {
    it('affiche les chiffres du serveur, et non des valeurs codées en dur', async () => {
      vi.spyOn(dashboardApi, 'getInfrastructureKpi').mockResolvedValue(INFRASTRUCTURE);
      vi.spyOn(dashboardApi, 'getDistributionCycles').mockResolvedValue(CYCLES);

      const wrapper = mount(VueEnsembleTab);
      await flushPromises();

      const texte = texteNormalise(wrapper);
      expect(texte).toContain('26 Inscrits');
      expect(texte).toContain('1 610 Places');
      expect(texte).toContain('1 584');
      expect(texte).toContain('Répartis sur 10 classes');
      // 26 / 1610 = 1,6 %
      expect(texte).toContain('1.6 %');

      // Les chiffres inventés de l'ancien écran ne doivent plus apparaître.
      expect(texte).not.toContain('37 050 000');
      expect(texte).not.toContain('482 Inscrits');
    });

    it('remplace les diagnostics IA inventés par un état honnête', async () => {
      vi.spyOn(dashboardApi, 'getInfrastructureKpi').mockResolvedValue(INFRASTRUCTURE);
      vi.spyOn(dashboardApi, 'getDistributionCycles').mockResolvedValue(CYCLES);

      const wrapper = mount(VueEnsembleTab);
      await flushPromises();

      expect(wrapper.text()).toContain('Diagnostics indisponibles');
      // Les trois alertes fabriquées de l'ancien panneau.
      expect(wrapper.text()).not.toContain('Sciences Juridiques');
      expect(wrapper.text()).not.toContain('Seuil de Rentabilité');
    });

    it('détruit son graphique au démontage', async () => {
      vi.spyOn(dashboardApi, 'getInfrastructureKpi').mockResolvedValue(INFRASTRUCTURE);
      vi.spyOn(dashboardApi, 'getDistributionCycles').mockResolvedValue(CYCLES);

      const wrapper = mount(VueEnsembleTab, { attachTo: document.body });
      await flushPromises();
      wrapper.unmount();

      expect(destroy).toHaveBeenCalled();
    });

    it("n'affiche pas NaN quand le serveur ne renvoie aucune capacité", async () => {
      vi.spyOn(dashboardApi, 'getInfrastructureKpi').mockResolvedValue({
        success: true,
        data: {
          total_classes: '0',
          capacite_totale_etablissement: '0',
          total_etudiants_inscrits: '0',
          places_disponibles_globales: '0',
        },
      });
      vi.spyOn(dashboardApi, 'getDistributionCycles').mockResolvedValue({
        success: true,
        data: [],
      });

      const wrapper = mount(VueEnsembleTab);
      await flushPromises();

      expect(wrapper.text()).not.toContain('NaN');
      expect(wrapper.text()).toContain('0.0 %');
      expect(wrapper.text()).toContain('Aucun étudiant réparti');
    });
  });

  describe('CyclesTab', () => {
    it('affiche le remplissage réel de chaque filière', async () => {
      vi.spyOn(dashboardApi, 'getDistributionCycles').mockResolvedValue(CYCLES);
      vi.spyOn(dashboardApi, 'getOrganisationFilieres').mockResolvedValue(FILIERES);

      const wrapper = mount(CyclesTab);
      await flushPromises();

      const texte = wrapper.text();
      expect(texte).toContain('Génie Informatique');
      expect(texte).toContain('1.8%');
      expect(texte).toContain('9 / 500 places');
      // La « Note Secrétariat » figée a cédé la place à une lecture dérivée.
      expect(texte).toContain('La plus fournie est Génie Informatique');
      expect(texte).not.toContain('émargements');
    });
  });

  describe('PedagogiesTab', () => {
    it('lit les libellés de la vue, et cumule les heures', async () => {
      vi.spyOn(dashboardApi, 'getEnseignants').mockResolvedValue(ENSEIGNANTS);
      vi.spyOn(dashboardApi, 'getAttributions').mockResolvedValue(ATTRIBUTIONS);

      const wrapper = mount(PedagogiesTab);
      await flushPromises();

      const texte = wrapper.text();
      expect(texte).toContain('2 Formateurs');
      expect(texte).toContain('1 Affectations');
      expect(texte).toContain('50 h');
      // `formateur` et `matiere` viennent tels quels de `vue_attributions_cours` :
      // les lire sous un autre nom afficherait « — » partout.
      expect(texte).toContain('Jean KOUMA');
      expect(texte).toContain('Algorithmique');
      expect(texte).not.toContain('Dr. Amadou Diallo');
    });

    it('reste lisible quand une attribution a perdu son formateur', async () => {
      vi.spyOn(dashboardApi, 'getEnseignants').mockResolvedValue(ENSEIGNANTS);
      vi.spyOn(dashboardApi, 'getAttributions').mockResolvedValue({
        success: true,
        data: [{ attribution_id: 'x', formateur: null, matiere: null, classe: null, heures: null }],
      });

      const wrapper = mount(PedagogiesTab);
      await flushPromises();

      expect(wrapper.text()).not.toContain('undefined');
      expect(wrapper.text()).not.toContain('null');
      expect(wrapper.text()).toContain('0 h');
    });
  });
});
