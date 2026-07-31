// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as noteApi from '../api';
import * as sessionApi from '@/modules/examens/session/api';
import * as epreuveApi from '@/modules/examens/epreuve/api';
import NotesView from './NotesView.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const SESSIONS = {
  success: true,
  data: [{ id: 's1', code: 'S1', designation: 'Session normale', etat: 'ACTIVE' }],
};

const EPREUVES = {
  success: true,
  data: [
    {
      id: 'ev1',
      session_id: 's1',
      module_id: 'm1',
      code_module: 'ALG1',
      designation: 'Examen final',
      type_eval: 'EXAMEN',
    },
  ],
};

/** Une note de chaque statut : seules deux ont leur place sur cet écran. */
const GRILLE = {
  success: true,
  data: [
    {
      note_id: 'n1',
      valeur: '14.00',
      statut: 'PUBLIEE',
      matricule: 'ETU-001',
      nom: 'Ndiaye',
      prenom: 'Fatou',
    },
    {
      note_id: 'n2',
      valeur: '12.00',
      statut: 'VALIDEE',
      matricule: 'ETU-002',
      nom: 'Camara',
      prenom: 'Ibrahima',
    },
    {
      note_id: 'n3',
      valeur: '05.00',
      statut: 'SAISIE',
      matricule: 'ETU-003',
      nom: 'Sow',
      prenom: 'Awa',
    },
  ],
};

const RouterLinkStub = { template: '<a><slot /></a>' };

describe('écran habituel des notes — consultation seule', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const monter = async (grille = GRILLE) => {
    vi.spyOn(sessionApi.sessionsResource, 'list').mockResolvedValue(SESSIONS);
    vi.spyOn(epreuveApi.epreuvesResource, 'list').mockResolvedValue(EPREUVES);
    vi.spyOn(noteApi, 'getNotesByEvaluation').mockResolvedValue(grille);

    const wrapper = mount(NotesView, {
      global: { stubs: { RouterLink: RouterLinkStub } },
    });
    await flushPromises();

    await wrapper.find('#notes-session').setValue('s1');
    await wrapper.find('#notes-epreuve').setValue('ev1');
    await flushPromises();

    return wrapper;
  };

  it('n’affiche que les notes validées ou publiées', async () => {
    const wrapper = await monter();
    const texte = wrapper.text();

    expect(texte).toContain('Ndiaye');
    expect(texte).toContain('Camara');
    // Une note encore en saisie est un brouillon : elle n'a rien à faire ici.
    expect(texte).not.toContain('Sow');
    expect(texte).toContain('1 note(s) de cette épreuve sont encore en saisie');
  });

  it('ne propose aucun champ de saisie ni aucune action de flux', async () => {
    const wrapper = await monter();

    expect(wrapper.findAll('input[type="number"]')).toHaveLength(0);
    const libelles = wrapper.findAll('button').map((bouton) => bouton.text());
    expect(libelles.join(' ')).not.toContain('Enregistrer');
    expect(libelles.join(' ')).not.toContain('Publier');
  });

  it('calcule ses statistiques sur les seules notes officielles', async () => {
    const wrapper = await monter();
    const texte = wrapper.text().replace(/\s+/g, ' ');

    // (14 + 12) / 2 = 13 — la note en saisie (5) ne pèse pas dans la moyenne.
    expect(texte).toContain('13.00 / 20');
    expect(texte).toContain('14.00 / 20');
    expect(texte).toContain('12.00 / 20');
  });

  it('explique l’absence de notes plutôt que d’afficher une grille vide', async () => {
    const wrapper = await monter({
      success: true,
      data: [{ ...GRILLE.data[2] }],
    });

    expect(wrapper.text()).toContain('Notes en cours de traitement');
    expect(wrapper.text()).toContain('pas encore validées par la scolarité');
  });

  it('ouvre l’espace de gestion dans une fenêtre dédiée', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue({});
    const wrapper = await monter();

    const bouton = wrapper
      .findAll('button')
      .find((element) => element.text().includes('espace de gestion'));
    await bouton.trigger('click');

    expect(open).toHaveBeenCalledWith(
      '/espace-notes',
      'espace-notes',
      expect.stringContaining('popup=yes')
    );
  });
});
