// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as concoursApi from '../api';
import * as candidatApi from '../../candidat/api';
import * as epreuveApi from '../../epreuve/api';
import * as exportExcelModule from '@/shared/utils/exportExcel';
import { useConcoursStore } from '../store';
import RapportStatistiquesTab from './RapportStatistiquesTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/** Chart.js touche au canvas, que jsdom n'implémente pas. */
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

const CONCOURS_ID = 'c-1';

const CLASSEMENT = {
  success: true,
  data: [
    {
      candidat_id: 'k1',
      num_table: 'T-0001',
      nom: 'NGANGA',
      prenom: 'Orphée',
      sexe: 'F',
      moyenne_generale: '16.68',
      rang: '1',
      admis: true,
      decision_jury: 'ADMIS',
      date_proclamation: '2026-08-02T00:24:00.460Z',
    },
    {
      candidat_id: 'k2',
      num_table: 'T-0002',
      nom: 'BAH',
      prenom: 'Ousmane',
      sexe: 'M',
      moyenne_generale: '9.50',
      rang: '2',
      admis: false,
      decision_jury: 'LISTE_ATTENTE',
      date_proclamation: '2026-08-02T00:24:00.460Z',
    },
  ],
};

const EPREUVES = {
  success: true,
  data: [{ id: 'e1', code: 'CG', designation: 'Culture générale', coefficient: 2, ordre: 1 }],
};

const NOTES = {
  success: true,
  data: [
    { num_table: 'T-0001', note: '18.00' },
    { num_table: 'T-0002', note: '8.00' },
  ],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglet Statistiques des résultats', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    configs.length = 0;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async ({ classement = CLASSEMENT } = {}) => {
    vi.spyOn(concoursApi, 'getClassement').mockResolvedValue(classement);
    vi.spyOn(epreuveApi, 'getEpreuvesByConcours').mockResolvedValue(EPREUVES);
    vi.spyOn(candidatApi, 'getCandidatsByEpreuve').mockResolvedValue(NOTES);

    // Le classement est chargé par la vue parente, comme en vrai.
    await useConcoursStore().fetchClassement(CONCOURS_ID);

    const wrapper = mount(RapportStatistiquesTab, {
      props: { concoursId: CONCOURS_ID, designation: 'Concours 2026' },
    });
    await flushPromises();
    return wrapper;
  };

  it('affiche les indicateurs dérivés du classement', async () => {
    const texte = texteNormalise(await monter());

    expect(texte).toContain('Candidats classés 2');
    expect(texte).toContain('13.09'); // (16.68 + 9.50) / 2
    expect(texte).toContain('16.68'); // meilleure moyenne
    expect(texte).not.toContain('NaN');
  });

  it('montre la délibération réelle du jury, pas une simulation', async () => {
    const texte = texteNormalise(await monter());

    expect(texte).toContain('Admis');
    expect(texte).toContain("Liste d'attente");
    expect(texte).toContain('50.0 %'); // 1 admis sur 2 délibérés
  });

  it('dit qu’un concours n’est pas proclamé au lieu d’afficher un taux nul', async () => {
    const sansDecision = {
      success: true,
      // eslint-disable-next-line no-unused-vars -- déstructuration pour omettre
      data: CLASSEMENT.data.map(({ decision_jury, admis, date_proclamation, ...reste }) => reste),
    };

    const texte = texteNormalise(await monter({ classement: sansDecision }));

    expect(texte).toContain('Résultats non proclamés');
    expect(texte).toContain("Taux d'admission —");
  });

  it('détaille chaque épreuve à partir des notes chargées', async () => {
    const texte = texteNormalise(await monter());

    expect(candidatApi.getCandidatsByEpreuve).toHaveBeenCalledWith(CONCOURS_ID, 'CG');
    expect(texte).toContain('Culture générale');
    expect(texte).toContain('13.00'); // (18 + 8) / 2
    expect(texte).toContain('50.0 %'); // une note sur deux ≥ 10
  });

  it('trace ses graphiques et les détruit au démontage', async () => {
    const wrapper = await monter({ attachTo: document.body });

    expect(configs).toHaveLength(2);
    expect(configs[0].type).toBe('bar'); // distribution des moyennes
    expect(configs[1].type).toBe('doughnut'); // décisions du jury

    wrapper.unmount();
    expect(destroy).toHaveBeenCalledTimes(2);
  });

  it('exporte les statistiques par épreuve, avec les indicateurs en tête', async () => {
    const excel = vi.spyOn(exportExcelModule, 'exportExcel').mockImplementation(() => {});
    const wrapper = await monter();

    await wrapper.findAll('.dropdown-item')[0].trigger('click');
    await flushPromises();

    expect(excel).toHaveBeenCalledTimes(1);
    const lignes = excel.mock.calls[0][0].data;
    expect(lignes).toHaveLength(1);
    expect(lignes[0]).toMatchObject({
      Code: 'CG',
      Coefficient: 2,
      'Candidats notés': '2 / 2',
      Moyenne: '13.00',
    });
  });

  it('reste lisible quand aucun classement n’existe', async () => {
    const wrapper = await monter({ classement: { success: true, data: [] } });

    expect(wrapper.text()).toContain('Aucun résultat à analyser');
    expect(configs).toHaveLength(0);
  });
});
