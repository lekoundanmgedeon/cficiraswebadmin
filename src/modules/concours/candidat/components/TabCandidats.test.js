// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as candidatApi from '../api';
import * as epreuveApi from '../../epreuve/api';
import * as concoursApi from '../../concours/api';
import * as exportExcelModule from '@/shared/utils/exportExcel';
import TabCandidats from './TabCandidats.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const CONCOURS_ID = 'c-1';

const CANDIDATS = {
  success: true,
  data: [
    {
      id: 'k1',
      num_table: 'T-2026-0001',
      nom: 'NGUÉMA',
      prenom: 'Xavier',
      sexe: 'M',
      email: 'x.nguema@exemple.com',
      tel: '+224620000001',
      lieunais: 'Conakry',
      ville: 'Conakry',
      statut_dossier: 'INCOMPLET',
      datenais: '2002-05-14',
    },
    {
      id: 'k2',
      num_table: 'T-2026-0002',
      nom: 'DIALLO',
      prenom: 'Aïcha',
      sexe: 'F',
      email: 'a.diallo@exemple.com',
      tel: '+224620000002',
      lieunais: 'Labé',
      ville: 'Labé',
      statut_dossier: 'VERIFIE',
      datenais: '2003-02-01',
    },
    {
      id: 'k3',
      num_table: 'T-2026-0003',
      nom: 'BAH',
      prenom: 'Ousmane',
      sexe: 'M',
      email: 'o.bah@exemple.com',
      tel: '+224620000003',
      lieunais: 'Kindia',
      ville: 'Kindia',
      // Aucun dossier déposé : la jointure est un LEFT JOIN.
      statut_dossier: null,
      datenais: '2001-11-20',
    },
  ],
};

const EPREUVES = {
  success: true,
  data: [{ id: 'e1', code: 'CG', designation: 'Culture générale', coefficient: 2, ordre: 1 }],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglet Candidatures', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async () => {
    vi.spyOn(candidatApi, 'getCandidatsByConcours').mockResolvedValue(CANDIDATS);
    vi.spyOn(epreuveApi, 'getEpreuvesByConcours').mockResolvedValue(EPREUVES);

    const wrapper = mount(TabCandidats, { props: { concoursId: CONCOURS_ID } });
    await flushPromises();
    return wrapper;
  };

  const chercher = async (wrapper, terme) => {
    await wrapper.find('input[type="search"]').setValue(terme);
    await flushPromises();
  };

  it('trouve un candidat malgré les accents et la casse', async () => {
    const wrapper = await monter();

    // « NGUÉMA » saisi sans accent, en minuscules.
    await chercher(wrapper, 'nguema');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(texteNormalise(wrapper)).toContain('NGUÉMA');

    // Et l'inverse : un terme accentué doit trouver la fiche.
    await chercher(wrapper, 'aïcha');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(texteNormalise(wrapper)).toContain('DIALLO');
  });

  it('accepte plusieurs termes, dans n’importe quel ordre', async () => {
    const wrapper = await monter();

    await chercher(wrapper, 'diallo 0002');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);

    // L'ordre inverse donne le même résultat — ce qu'une recherche sur une
    // chaîne continue ne ferait pas.
    await chercher(wrapper, '0002 diallo');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);

    // Deux termes qui ne cohabitent sur aucune fiche ne renvoient rien.
    await chercher(wrapper, 'diallo kindia');
    expect(texteNormalise(wrapper)).toContain('Aucun candidat ne correspond');
  });

  it('cherche aussi dans le courriel, le téléphone et le lieu de naissance', async () => {
    const wrapper = await monter();

    await chercher(wrapper, 'o.bah@exemple.com');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);

    await chercher(wrapper, 'labe');
    expect(texteNormalise(wrapper)).toContain('DIALLO');
  });

  it('filtre par statut de dossier, « non déposé » compris', async () => {
    const wrapper = await monter();
    const select = wrapper.findAll('select')[0];

    await select.setValue('VERIFIE');
    await flushPromises();
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(texteNormalise(wrapper)).toContain('Vérifié');

    // Un candidat sans dossier n'est pas « incomplet » : il n'a rien déposé.
    await select.setValue('ABSENT');
    await flushPromises();
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(texteNormalise(wrapper)).toContain('BAH');
  });

  it('exporte la sélection filtrée, et non la page', async () => {
    const excel = vi.spyOn(exportExcelModule, 'exportExcel').mockImplementation(() => {});
    const wrapper = await monter();

    await chercher(wrapper, 'conakry');
    await wrapper.findAll('.dropdown-item')[0].trigger('click');
    await flushPromises();

    expect(excel).toHaveBeenCalledTimes(1);
    const lignes = excel.mock.calls[0][0].data;
    expect(lignes).toHaveLength(1);
    expect(lignes[0]['N° table']).toBe('T-2026-0001');
    expect(lignes[0].Dossier).toBe('Incomplet');
  });

  it('ouvre le dossier complet du candidat', async () => {
    vi.spyOn(candidatApi, 'getCandidatById').mockResolvedValue({
      success: true,
      data: { ...CANDIDATS.data[0], nationalite: 'Guinéenne', motif_rejet_dossier: null },
    });
    vi.spyOn(candidatApi, 'getCandidatsByEpreuve').mockResolvedValue({
      success: true,
      data: [{ candidat_id: 'k1', num_table: 'T-2026-0001', note: '13.50' }],
    });
    vi.spyOn(concoursApi, 'getClassement').mockResolvedValue({
      success: true,
      data: [{ candidat_id: 'k1', moyenne_generale: '13.50', rang: 3 }],
    });

    const wrapper = await monter();
    await wrapper.findAll('tbody button')[0].trigger('click');
    await flushPromises();

    expect(candidatApi.getCandidatById).toHaveBeenCalledWith('k1');

    const modale = document.body.querySelector('.modal');
    const texte = modale.textContent.replace(/\s+/g, ' ');

    expect(texte).toContain('NGUÉMA Xavier');
    expect(texte).toContain('Guinéenne');
    expect(texte).toContain('Culture générale');
    expect(texte).toContain('13.50'); // note de l'épreuve et moyenne
    expect(texte).toContain('Rang');

    wrapper.unmount();
  });
});
