// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as cycleApi from '../../api';
import * as classeApi from '../../../classe/api';
import StatistiquesTab from './StatistiquesTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Chart.js touche au canvas, que jsdom n'implémente pas. Le double garde la
 * configuration reçue — c'est elle qu'on inspecte — et vérifie que `destroy()`
 * est appelé : trois instances non détruites fuient à chaque changement
 * d'onglet.
 */
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

const CYCLES = {
  success: true,
  data: [
    { id: 'c1', code: 'LG', diplome: 'Licence Générale', duree_annees: 3, credits_total: 180 },
    { id: 'c2', code: 'MR', diplome: 'Master Recherche', duree_annees: 2, credits_total: 120 },
  ],
};

/** `v_organisation_classes` : une ligne par classe, compteurs en chaînes. */
const ORGANISATION_CLASSES = {
  success: true,
  data: [
    {
      id: 'k1',
      classe: 'LG-INFO-L1',
      filiere: 'Informatique',
      cycle_code: 'LG',
      cycle: 'Licence Générale',
      niveau: 'L1',
      effectif: '30',
      capacite: '40',
      taux: '75',
      statut: 'OUVERTE',
    },
    {
      id: 'k2',
      classe: 'LG-MATH-L1',
      filiere: 'Mathématiques',
      cycle_code: 'LG',
      cycle: 'Licence Générale',
      niveau: 'L1',
      effectif: '10',
      capacite: '40',
      taux: '25',
      statut: 'OUVERTE',
    },
  ],
};

const DISTRIBUTION = {
  success: true,
  data: [{ cycle_id: 'c1', cycle_code: 'LG', diplome: 'Licence Générale', nb_etudiants: '38' }],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglet Statistiques des cycles', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    configs.length = 0;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async (options = {}) => {
    vi.spyOn(cycleApi.cyclesResource, 'list').mockResolvedValue(CYCLES);
    vi.spyOn(cycleApi, 'getCycleDistributionStats').mockResolvedValue(DISTRIBUTION);
    vi.spyOn(classeApi, 'getClassesOrganisationTree').mockResolvedValue(ORGANISATION_CLASSES);

    const wrapper = mount(StatistiquesTab, options);
    await flushPromises();
    return wrapper;
  };

  it('agrège les classes réelles au lieu du tableau plat d’avant', async () => {
    const texte = texteNormalise(await monter());

    expect(texte).toContain('Cycles actifs 1');
    expect(texte).toContain('sur 2 déclaré(s) · 2 filière(s)');
    expect(texte).toContain('Étudiants inscrits 40');
    expect(texte).toContain('répartis sur 2 classe(s)');
    // 40 / 80 : la capacité ne vient pas de `v_organisation_cycles`, qui la
    // multiplierait par le nombre d'inscrits.
    expect(texte).toContain('50.0 %');
    expect(texte).toContain('Places disponibles 40');
    expect(texte).not.toContain('NaN');
  });

  it('n’appelle jamais la vue d’organisation des cycles, dont la capacité est fausse', async () => {
    const organisation = vi.spyOn(cycleApi, 'getCycleOrganisation');
    await monter();

    expect(organisation).not.toHaveBeenCalled();
    expect(classeApi.getClassesOrganisationTree).toHaveBeenCalledTimes(1);
  });

  it('affiche le diplôme, et non le `cycle_nom` qui n’existe dans aucune vue', async () => {
    const texte = texteNormalise(await monter());

    expect(texte).toContain('Licence Générale');
    expect(texte).toContain('Master Recherche');
    expect(texte).not.toContain('Cycle Académique');
  });

  it('trace un graphique par lecture disponible et les détruit au démontage', async () => {
    const wrapper = await monter({ attachTo: document.body });

    expect(configs).toHaveLength(3);
    const [effectifs, repartition, remplissage] = configs;
    expect(effectifs.type).toBe('bar');
    expect(effectifs.data.labels).toEqual(['LG']); // seuls les cycles actifs
    expect(effectifs.data.datasets[0].data).toEqual([40]);
    expect(repartition.type).toBe('doughnut');
    expect(remplissage.options.indexAxis).toBe('y');

    wrapper.unmount();
    expect(destroy).toHaveBeenCalledTimes(3);
  });

  it('dérive sa lecture des chiffres affichés', async () => {
    const texte = texteNormalise(await monter());

    expect(texte).toContain('1 cycle(s) sans classe'); // MR
    expect(texte).toContain('Inscriptions multiples'); // 40 inscriptions, 38 étudiants
    expect(texte).toContain('Effectifs concentrés'); // LG porte 100 % des inscrits
    // Un cycle sans classe est une tension : le message rassurant reste muet.
    expect(texte).not.toContain('Aucune tension de capacité');
  });

  it('filtre le détail et le pagine', async () => {
    const wrapper = await monter();

    expect(wrapper.findAll('tbody tr')).toHaveLength(2);

    await wrapper.find('input[type="text"]').setValue('Master');
    await flushPromises();

    const lignes = wrapper.findAll('tbody tr');
    expect(lignes).toHaveLength(1);
    expect(lignes[0].text()).toContain('MR');
  });

  it('reste lisible quand aucun cycle n’est déclaré', async () => {
    vi.spyOn(cycleApi.cyclesResource, 'list').mockResolvedValue({ success: true, data: [] });
    vi.spyOn(cycleApi, 'getCycleDistributionStats').mockResolvedValue({ success: true, data: [] });
    vi.spyOn(classeApi, 'getClassesOrganisationTree').mockResolvedValue({
      success: true,
      data: [],
    });

    const wrapper = mount(StatistiquesTab);
    await flushPromises();

    expect(wrapper.text()).toContain('Aucun cycle configuré');
    expect(wrapper.text()).not.toContain('NaN');
    expect(configs).toHaveLength(0);
  });
});
