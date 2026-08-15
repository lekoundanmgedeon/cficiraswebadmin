// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as epreuveApi from '../../epreuve/api';
import * as sessionApi from '../../session/api';
import * as moduleApi from '@/modules/matieres/api';
import * as exportExcelModule from '@/shared/utils/exportExcel';
import CalendrierEpreuves from './CalendrierEpreuves.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/** Bootstrap n'est pas chargé en test : la modale s'ouvre via cet utilitaire. */
const openModal = vi.fn();
vi.mock('@/shared/utils/modal', () => ({
  openModal: (...args) => openModal(...args),
  closeModal: vi.fn(),
}));

const SESSIONS = {
  success: true,
  data: [
    { id: 'sn1', code: 'SN-2025', designation: 'Session normale 2025', type_session: 'NORMALE' },
    { id: 'sr1', code: 'SR-2025', designation: 'Rattrapage 2025', type_session: 'RATTRAPAGE' },
  ],
};

/** 18 épreuves de session normale : deux pages de 15. */
const EPREUVES = {
  success: true,
  data: [
    ...Array.from({ length: 18 }, (_, index) => ({
      id: `e${index}`,
      session_id: 'sn1',
      code_session: 'SN-2025',
      code_module: `INF${100 + index}`,
      designation_module: `Module ${index}`,
      designation: `Épreuve ${index}`,
      type_eval: 'EXAMEN',
      ponderation: '100',
      date_prevue: `2026-01-${String((index % 28) + 1).padStart(2, '0')}`,
    })),
    {
      id: 'r1',
      session_id: 'sr1',
      code_session: 'SR-2025',
      code_module: 'INF999',
      designation_module: 'Module de rattrapage',
      designation: 'Rattrapage algorithmique',
      type_eval: 'EXAMEN',
      ponderation: '100',
      date_prevue: null,
    },
  ],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('calendrier des épreuves', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async (typeSession = 'NORMALE') => {
    vi.spyOn(epreuveApi.epreuvesResource, 'list').mockResolvedValue(EPREUVES);
    vi.spyOn(sessionApi.sessionsResource, 'list').mockResolvedValue(SESSIONS);
    vi.spyOn(moduleApi.modulesResource, 'list').mockResolvedValue({ success: true, data: [] });

    const wrapper = mount(CalendrierEpreuves, { props: { typeSession } });
    await flushPromises();
    return wrapper;
  };

  it('ne montre que les épreuves du type de session de l’onglet', async () => {
    const wrapper = await monter('RATTRAPAGE');

    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(texteNormalise(wrapper)).toContain('Rattrapage algorithmique');
  });

  it('pagine le planning au lieu de le déverser en entier', async () => {
    const wrapper = await monter();

    // 18 épreuves, 15 par page.
    expect(wrapper.findAll('tbody tr')).toHaveLength(15);
    expect(texteNormalise(wrapper)).toContain('18 Épreuve(s) trouvée(s)');
    expect(texteNormalise(wrapper)).toContain('Affichage de 1 à 15 sur 18 résultats');
  });

  it('revient en première page quand un filtre change', async () => {
    const wrapper = await monter();

    const boutonsPage = wrapper.findAll('.pagination .page-link');
    await boutonsPage.find((bouton) => bouton.text() === '2').trigger('click');
    await flushPromises();
    expect(texteNormalise(wrapper)).toContain('Affichage de 16 à 18');

    await wrapper.find('input[type="text"]').setValue('Épreuve 1');
    await flushPromises();

    expect(texteNormalise(wrapper)).toContain('Affichage de 1 à');
  });

  it('publie le calendrier entier, et non la page affichée', async () => {
    const excel = vi.spyOn(exportExcelModule, 'exportExcel').mockImplementation(() => {});
    const wrapper = await monter();

    await wrapper.findAll('.dropdown-item')[0].trigger('click');
    await flushPromises();

    expect(excel).toHaveBeenCalledTimes(1);
    // 18 lignes exportées alors que 15 seulement sont à l'écran.
    expect(excel.mock.calls[0][0].data).toHaveLength(18);
    // Le titre dépasse 31 caractères : sans abréviation, XLSX lèverait.
    expect(excel.mock.calls[0][0].sheetName).toContain('Calendrier officiel');
  });

  it('offre la planification unitaire et l’import par lot', async () => {
    const wrapper = await monter();
    const boutons = wrapper.findAll('.btn-group[role="group"] button');

    expect(boutons.map((bouton) => bouton.text().trim())).toEqual([
      'Planifier une épreuve',
      'Importer un planning',
    ]);

    await boutons[0].trigger('click');
    expect(openModal).toHaveBeenCalledWith('epreuveExamenModal');

    await boutons[1].trigger('click');
    expect(openModal).toHaveBeenCalledWith('planningImportModal');
  });
});
