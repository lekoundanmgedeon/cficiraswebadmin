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

/**
 * Chart.js touche au canvas, que jsdom n'implémente pas. Le double garde la
 * configuration reçue — c'est elle qu'on inspecte, pas le rendu — et vérifie
 * que `destroy()` est appelé : trois instances non détruites fuient à chaque
 * changement d'onglet.
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

const LISTE = {
  success: true,
  data: [
    {
      id: '2365',
      code: 'GI',
      designation: 'Génie Informatique',
      cycle_nom: 'Licence',
      nb_classes: 3,
      nb_etudiants: 9,
    },
    {
      id: 'd9fd',
      code: 'ELEC',
      designation: 'Electricite',
      cycle_nom: 'Licence',
      nb_classes: 2,
      nb_etudiants: 0,
    },
  ],
};

const ORGANISATION = {
  success: true,
  data: [
    {
      id: '2365',
      filiere: 'Génie Informatique',
      responsable: 'Non assigné',
      effectif: '12',
      capacite: '60',
      taux: '20.00',
      statut: 'OUVERTE',
    },
    {
      id: 'd9fd',
      filiere: 'Electricite',
      responsable: 'Non assigné',
      effectif: '0',
      capacite: '60',
      taux: '0.00',
      statut: 'VIDE',
    },
  ],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglet Statistiques des filières', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    configs.length = 0;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async (options = {}) => {
    vi.spyOn(api.filieresResource, 'list').mockResolvedValue(LISTE);
    vi.spyOn(api, 'getFiliereOrganisation').mockResolvedValue(ORGANISATION);
    const wrapper = mount(StatistiquesTab, options);
    await flushPromises();
    return wrapper;
  };

  it("affiche les indicateurs croisés des deux vues, et non les deux seuls compteurs d'avant", async () => {
    const wrapper = await monter();
    const texte = texteNormalise(wrapper);

    expect(texte).toContain('Filières actives 1');
    expect(texte).toContain('sur 2 déclarée(s)');
    expect(texte).toContain('Étudiants inscrits 12');
    expect(texte).toContain('répartis sur 5 classe(s)');
    // 12 / 120 = 10 % — la capacité n'apparaissait nulle part avant.
    expect(texte).toContain('10.0 %');
    expect(texte).toContain('Places disponibles 108');
    expect(texte).not.toContain('NaN');
  });

  it('trace un graphique par lecture disponible', async () => {
    await monter();

    expect(configs).toHaveLength(3);
    const [effectifs, cycles, remplissage] = configs;

    expect(effectifs.type).toBe('bar');
    expect(effectifs.data.labels).toEqual(['GI']); // seules les filières actives
    expect(effectifs.data.datasets[0].data).toEqual([12]);

    expect(cycles.type).toBe('doughnut');
    expect(cycles.data.labels).toEqual(['Licence']);

    expect(remplissage.options.indexAxis).toBe('y');
    // Les deux filières ont une capacité déclarée, y compris la filière vide.
    expect(remplissage.data.labels).toEqual(['GI', 'ELEC']);
    expect(remplissage.data.datasets[0].data).toEqual([20, 0]);
  });

  it('dérive sa lecture des chiffres affichés', async () => {
    const wrapper = await monter();
    const texte = texteNormalise(wrapper);

    expect(texte).toContain('1 filière(s) sans inscrit');
    expect(texte).toContain('Electricite');
    expect(texte).toContain('Aucune tension de capacité');
  });

  it('sert le détail par filière depuis le serveur', async () => {
    const stats = vi
      .spyOn(api, 'getFiliereStats')
      .mockResolvedValue({ success: true, data: { nb_etudiants: '12', nb_classes: '3' } });

    const wrapper = await monter();
    await wrapper.find('#filiereSelect').setValue('2365');
    await flushPromises();

    expect(stats).toHaveBeenCalledWith('2365');
    const texte = texteNormalise(wrapper);
    expect(texte).toContain('Moyenne par classe4.0');
    expect(texte).toContain('Places restantes48 sur 60');
    expect(texte).toContain('OUVERTE');
  });

  it('détruit ses graphiques au démontage', async () => {
    const wrapper = await monter({ attachTo: document.body });
    wrapper.unmount();

    expect(destroy).toHaveBeenCalledTimes(3);
  });

  it("reste lisible quand aucune filière n'est déclarée", async () => {
    vi.spyOn(api.filieresResource, 'list').mockResolvedValue({ success: true, data: [] });
    vi.spyOn(api, 'getFiliereOrganisation').mockResolvedValue({ success: true, data: [] });

    const wrapper = mount(StatistiquesTab);
    await flushPromises();

    expect(wrapper.text()).toContain('Aucune filière enregistrée');
    expect(wrapper.text()).not.toContain('NaN');
    expect(configs).toHaveLength(0);
  });
});
