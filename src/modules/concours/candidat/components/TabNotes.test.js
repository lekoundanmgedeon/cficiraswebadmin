// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as candidatApi from '../api';
import * as epreuveApi from '../../epreuve/api';
import TabNotes from './TabNotes.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const CONCOURS_ID = 'c-1';

const EPREUVES = {
  success: true,
  data: [
    { id: 'e1', code: 'CG', designation: 'Culture générale', coefficient: 2, ordre: 1 },
    { id: 'e2', code: 'MATH', designation: 'Mathématiques', coefficient: 3, ordre: 2 },
  ],
};

const CANDIDATS = {
  success: true,
  data: [
    { id: 'k1', num_table: 'T-2026-0001', nom: 'NIANGA', prenom: 'Xavier', sexe: 'M' },
    { id: 'k2', num_table: 'T-2026-0002', nom: 'DIALLO', prenom: 'Aïcha', sexe: 'F' },
  ],
};

/** 30 candidats : de quoi dépasser les 25 lignes d'une page. */
const CANDIDATS_NOMBREUX = {
  success: true,
  data: Array.from({ length: 30 }, (_, index) => ({
    id: `k${index}`,
    num_table: `T-2026-${String(index + 1).padStart(4, '0')}`,
    nom: `CANDIDAT${index}`,
    prenom: 'Test',
    sexe: 'M',
  })),
};

/**
 * `v_candidats_epreuves` joint `notes_epreuves_concours` en `LEFT JOIN` : une
 * note absente vaut `null`, et `pg` sert `NUMERIC` en **chaîne**.
 */
const NOTES_CG = {
  success: true,
  data: [
    { candidat_id: 'k1', num_table: 'T-2026-0001', nom: 'NIANGA', note: '10.75' },
    { candidat_id: 'k2', num_table: 'T-2026-0002', nom: 'DIALLO', note: null },
  ],
};

const NOTES_MATH = {
  success: true,
  data: [
    { candidat_id: 'k1', num_table: 'T-2026-0001', nom: 'NIANGA', note: '14.00' },
    { candidat_id: 'k2', num_table: 'T-2026-0002', nom: 'DIALLO', note: '8.50' },
  ],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglet Saisie des notes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async () => {
    vi.spyOn(epreuveApi, 'getEpreuvesByConcours').mockResolvedValue(EPREUVES);
    vi.spyOn(candidatApi, 'getCandidatsByConcours').mockResolvedValue(CANDIDATS);
    vi.spyOn(candidatApi, 'getCandidatsByEpreuve').mockImplementation((_id, code) =>
      Promise.resolve(code === 'CG' ? NOTES_CG : NOTES_MATH)
    );

    const wrapper = mount(TabNotes, { props: { concoursId: CONCOURS_ID } });
    await flushPromises();
    return wrapper;
  };

  it('préremplit la grille avec les notes déjà enregistrées', async () => {
    const wrapper = await monter();
    const champs = wrapper.findAll('tbody input[type="number"]');

    // C'est tout le défaut corrigé : la grille naissait avec `note: ''`.
    expect(champs).toHaveLength(2);
    expect(champs[0].element.value).toBe('10.75');
    // Une note absente reste une case vide, et non un zéro.
    expect(champs[1].element.value).toBe('');
  });

  it('demande les notes de l’épreuve, sans écraser la liste des candidats', async () => {
    const wrapper = await monter();

    expect(candidatApi.getCandidatsByEpreuve).toHaveBeenCalledWith(CONCOURS_ID, 'CG');
    // `items` reste la liste des candidats : les deux lignes sont toujours là.
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    expect(texteNormalise(wrapper)).toContain('T-2026-0002');
  });

  it('compte les notes venues du serveur', async () => {
    const texte = texteNormalise(await monter());

    expect(texte).toContain('1 enregistrée(s)');
    expect(texte).toContain('1 / 2 note(s) saisie(s)');
  });

  it('recharge les notes quand on change d’épreuve', async () => {
    const wrapper = await monter();

    await wrapper.find('select').setValue('e2');
    await flushPromises();

    expect(candidatApi.getCandidatsByEpreuve).toHaveBeenCalledWith(CONCOURS_ID, 'MATH');

    const champs = wrapper.findAll('tbody input[type="number"]');
    expect(champs[0].element.value).toBe('14');
    expect(champs[1].element.value).toBe('8.5');
  });

  describe('pagination de la grille', () => {
    const monterNombreux = async () => {
      vi.spyOn(epreuveApi, 'getEpreuvesByConcours').mockResolvedValue(EPREUVES);
      vi.spyOn(candidatApi, 'getCandidatsByConcours').mockResolvedValue(CANDIDATS_NOMBREUX);
      vi.spyOn(candidatApi, 'getCandidatsByEpreuve').mockResolvedValue({ success: true, data: [] });

      const wrapper = mount(TabNotes, { props: { concoursId: CONCOURS_ID } });
      await flushPromises();
      return wrapper;
    };

    const allerPage = async (wrapper, numero) => {
      const bouton = wrapper
        .findAll('.pagination .page-link')
        .find((lien) => lien.text() === String(numero));
      await bouton.trigger('click');
      await flushPromises();
    };

    it('découpe la grille en pages de 25 lignes', async () => {
      const wrapper = await monterNombreux();

      expect(wrapper.findAll('tbody tr')).toHaveLength(25);
      expect(texteNormalise(wrapper)).toContain('Affichage de 1 à 25 sur 30 résultats');
    });

    it('conserve une note saisie quand on change de page', async () => {
      const wrapper = await monterNombreux();

      const champ = wrapper.findAll('tbody input[type="number"]')[0];
      await champ.setValue('15');
      await champ.trigger('input');
      await flushPromises();

      // La pagination ne découpe que l'affichage : la saisie vit dans
      // `notesRows`, pas dans la ligne rendue.
      await allerPage(wrapper, 2);
      expect(texteNormalise(wrapper)).toContain('1 non enregistrée(s)');
      expect(texteNormalise(wrapper)).toContain('dont 1 hors page');

      await allerPage(wrapper, 1);
      expect(wrapper.findAll('tbody input[type="number"]')[0].element.value).toBe('15');
    });

    it('envoie les lignes modifiées de toutes les pages, pas seulement de la page affichée', async () => {
      const wrapper = await monterNombreux();
      const addNote = vi
        .spyOn(candidatApi, 'addNoteEpreuve')
        .mockResolvedValue({ success: true, data: {} });

      const premier = wrapper.findAll('tbody input[type="number"]')[0];
      await premier.setValue('11');
      await premier.trigger('input');

      await allerPage(wrapper, 2);
      const dernier = wrapper.findAll('tbody input[type="number"]')[0];
      await dernier.setValue('12');
      await dernier.trigger('input');
      await flushPromises();

      await wrapper.find('button.btn-primary').trigger('click');
      await flushPromises();

      expect(addNote).toHaveBeenCalledTimes(2);
      expect(addNote.mock.calls.map(([numTable]) => numTable)).toEqual([
        'T-2026-0001',
        'T-2026-0026',
      ]);
    });

    it('revient en première page quand on change d’épreuve', async () => {
      const wrapper = await monterNombreux();

      await allerPage(wrapper, 2);
      expect(texteNormalise(wrapper)).toContain('Affichage de 26 à 30');

      await wrapper.find('select').setValue('e2');
      await flushPromises();

      expect(texteNormalise(wrapper)).toContain('Affichage de 1 à 25');
    });
  });

  it('relit le serveur après enregistrement plutôt que de croire la grille', async () => {
    const wrapper = await monter();
    vi.spyOn(candidatApi, 'addNoteEpreuve').mockResolvedValue({ success: true, data: {} });

    const champs = wrapper.findAll('tbody input[type="number"]');
    await champs[1].setValue('12');
    await champs[1].trigger('input');
    await flushPromises();

    await wrapper.find('button.btn-primary').trigger('click');
    await flushPromises();

    expect(candidatApi.addNoteEpreuve).toHaveBeenCalledWith('T-2026-0002', {
      concours_id: CONCOURS_ID,
      code_epreuve: 'CG',
      note: 12,
      appreciation: null,
    });
    // Deux appels pour CG : le chargement initial, puis la relecture forcée.
    const appelsCG = candidatApi.getCandidatsByEpreuve.mock.calls.filter(
      ([, code]) => code === 'CG'
    );
    expect(appelsCG).toHaveLength(2);
  });
});
