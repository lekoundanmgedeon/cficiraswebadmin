// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as api from '../../api';
import StatistiquesTab from './StatistiquesTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const destroy = vi.fn();
const configs = [];
vi.mock('chart.js/auto', () => ({
  default: class {
    constructor(canvas, config) {
      configs.push(config);
    }
    destroy = destroy;
  },
}));

/** `v_organisation_classes`, avec ses compteurs en chaînes. */
const ORGANISATION = {
  success: true,
  data: [
    {
      id: 'k1',
      classe: 'LG-INFO-L1',
      filiere: 'Informatique',
      cycle_code: 'LG',
      cycle: 'Licence Générale',
      niveau: 'L1',
      effectif: '40',
      capacite: '40',
      taux: '100',
      statut: 'COMPLÈTE',
    },
    {
      id: 'k2',
      classe: 'LG-INFO-L2',
      filiere: 'Informatique',
      cycle_code: 'LG',
      cycle: 'Licence Générale',
      niveau: 'L2',
      effectif: '10',
      capacite: '40',
      taux: '25',
      statut: 'OUVERTE',
    },
    {
      id: 'k3',
      classe: 'ING-GC-L1',
      filiere: 'Génie Civil',
      cycle_code: 'ING',
      cycle: "Diplôme d'Ingénieur",
      niveau: 'L1',
      effectif: '0',
      capacite: '20',
      taux: '0',
      statut: 'FERMÉE',
    },
  ],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglet Statistiques des classes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    configs.length = 0;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async (options = {}) => {
    vi.spyOn(api, 'getClassesOrganisationTree').mockResolvedValue(ORGANISATION);
    const wrapper = mount(StatistiquesTab, options);
    await flushPromises();
    return wrapper;
  };

  it('recompose les compteurs sans la vue dont la capacité est gonflée', async () => {
    const kpis = vi.spyOn(api, 'getGlobalInfrastructureKPIs');
    const texte = texteNormalise(await monter());

    // 100 places réelles : `v_dashboard_global_classe` en aurait annoncé 340,
    // chaque classe y comptant autant de fois qu'elle a d'inscrits.
    expect(kpis).not.toHaveBeenCalled();
    expect(texte).toContain('Classes ouvertes 2');
    expect(texte).toContain('sur 3 déclarée(s) · 2 filière(s)');
    expect(texte).toContain('Étudiants inscrits 50');
    expect(texte).toContain('50.0 %');
    expect(texte).toContain('Places disponibles 50');
    expect(texte).not.toContain('NaN');
  });

  it('change de dimension d’agrégation sans nouvelle requête', async () => {
    const wrapper = await monter();

    expect(texteNormalise(wrapper)).toContain('Détail par filière');
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Informatique');

    const boutons = wrapper.findAll('.btn-group button');
    await boutons.find((bouton) => bouton.text() === 'Niveau').trigger('click');
    await flushPromises();

    expect(texteNormalise(wrapper)).toContain('Détail par niveau');
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('L1');
    expect(api.getClassesOrganisationTree).toHaveBeenCalledTimes(1);
  });

  it('trace ses trois graphiques et les détruit au démontage', async () => {
    const wrapper = await monter({ attachTo: document.body });

    expect(configs).toHaveLength(3);
    const [groupes, cycles, paliers] = configs;
    expect(groupes.options.indexAxis).toBe('y');
    expect(groupes.data.datasets.map((jeu) => jeu.label)).toEqual([
      'Inscrits',
      'Places restantes',
    ]);
    expect(cycles.type).toBe('doughnut');
    expect(paliers.data.labels).toContain('Complètes');

    wrapper.unmount();
    expect(destroy).toHaveBeenCalledTimes(3);
  });

  it('dérive sa lecture des chiffres affichés', async () => {
    const texte = texteNormalise(await monter());

    expect(texte).toContain('1 classe(s) au complet');
    expect(texte).toContain('1 classe(s) sans inscrit');
    expect(texte).toContain('Taille moyenne des classes');
  });

  it('reste lisible quand aucune classe n’est enregistrée', async () => {
    vi.spyOn(api, 'getClassesOrganisationTree').mockResolvedValue({ success: true, data: [] });

    const wrapper = mount(StatistiquesTab);
    await flushPromises();

    expect(wrapper.text()).toContain('Aucune classe enregistrée');
    expect(wrapper.text()).not.toContain('NaN');
    expect(configs).toHaveLength(0);
  });
});
