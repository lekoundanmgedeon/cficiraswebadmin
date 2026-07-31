// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/core/auth/authStore';
import * as classeApi from '@/modules/structure-academique/classe/api';
import * as sessionApi from '@/modules/examens/session/api';
import * as epreuveApi from '@/modules/examens/epreuve/api';
import * as noteApi from '@/modules/notes/note/api';
import GrilleNotesView from './GrilleNotesView.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const CLASSES = {
  success: true,
  data: [{ id: 'c1', code: 'GI-L1', filiere_nom: 'Génie Informatique', niveau_code: 'L1' }],
};

const SESSIONS = {
  success: true,
  data: [{ id: 's1', code: 'S1', designation: 'Session normale', etat: 'ACTIVE' }],
};

const EVALUATIONS = {
  success: true,
  data: [
    {
      id: 'ev1',
      module_id: 'm1',
      session_id: 's1',
      code_module: 'ALG1',
      designation: 'Examen final',
      type_eval: 'EXAMEN',
    },
  ],
};

const MODULES = {
  success: true,
  data: [{ id: 'm1', code: 'ALG1', designation: 'Algorithmique' }],
};

/** Trois inscrits… */
const ETUDIANTS = {
  success: true,
  data: [
    { id: 'et1', matricule: 'ETU-001', nom: 'Ndiaye', prenom: 'Fatou' },
    { id: 'et2', matricule: 'ETU-002', nom: 'Camara', prenom: 'Ibrahima' },
    { id: 'et3', matricule: 'ETU-003', nom: 'Sow', prenom: 'Awa' },
  ],
};

/** … dont un seul a déjà une note. */
const GRILLE = {
  success: true,
  data: [
    {
      note_id: 'n1',
      valeur: '14.00',
      statut: 'SAISIE',
      commentaire: null,
      matricule: 'ETU-001',
      nom: 'Ndiaye',
      prenom: 'Fatou',
    },
  ],
};

const RouterLinkStub = { template: '<a><slot /></a>' };

/**
 * Monte l'écran avec un rôle donné et le contexte sélectionné jusqu'à
 * l'évaluation.
 */
const monter = async (role, grille = GRILLE) => {
  vi.spyOn(classeApi.classesResource, 'list').mockResolvedValue(CLASSES);
  vi.spyOn(sessionApi.sessionsResource, 'list').mockResolvedValue(SESSIONS);
  vi.spyOn(epreuveApi.epreuvesResource, 'list').mockResolvedValue(EVALUATIONS);
  vi.spyOn(classeApi, 'getClasseModules').mockResolvedValue(MODULES);
  vi.spyOn(classeApi, 'getClasseStudents').mockResolvedValue(ETUDIANTS);
  vi.spyOn(noteApi, 'getNotesByEvaluation').mockResolvedValue(grille);

  const auth = useAuthStore();
  auth.user = { id: 'u1', username: 'test', role };
  vi.spyOn(auth, 'fetchCurrentUser').mockResolvedValue(auth.user);

  const wrapper = mount(GrilleNotesView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  await flushPromises();

  await wrapper.find('#grille-classe').setValue('c1');
  await flushPromises();
  await wrapper.find('#grille-evaluation').setValue('ev1');
  await flushPromises();

  return wrapper;
};

const boutonNomme = (wrapper, texte) =>
  wrapper.findAll('button').find((bouton) => bouton.text().includes(texte));

describe('grille de notes de l’espace', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('affiche tout l’effectif, et pas seulement les étudiants déjà notés', async () => {
    const wrapper = await monter('ENSEIGNANT');
    const texte = wrapper.text().replace(/\s+/g, ' ');

    // La grille du serveur ne connaît que `ETU-001` : les deux autres viennent
    // de l'effectif de la classe, sans quoi ils seraient impossibles à noter.
    expect(texte).toContain('ETU-001');
    expect(texte).toContain('ETU-002');
    expect(texte).toContain('ETU-003');
    expect(texte).toContain('Notes saisies1 / 3');
    expect(texte).toContain('Grille non conforme');
    expect(texte).toContain('2 étudiant(s) sans note');
  });

  it('enregistre en lot, par matricule, les seules lignes modifiées', async () => {
    const saisie = vi.spyOn(noteApi, 'saisirNotesBatch').mockResolvedValue({
      success: true,
      data: { total_traite: 1, total_succes: 1, total_echecs: 0, erreurs: [] },
    });

    const wrapper = await monter('ENSEIGNANT');
    const champs = wrapper.findAll('input[type="number"]');
    await champs[1].setValue('11.5');
    await flushPromises();

    await boutonNomme(wrapper, 'Enregistrer').trigger('click');
    await flushPromises();

    expect(saisie).toHaveBeenCalledWith('ev1', [
      { matricule: 'ETU-002', note: 11.5, commentaire: null },
    ]);
  });

  it('n’offre à l’enseignant ni validation ni publication', async () => {
    const wrapper = await monter('ENSEIGNANT');

    expect(boutonNomme(wrapper, 'Enregistrer')).toBeDefined();
    expect(boutonNomme(wrapper, 'Valider la grille')).toBeUndefined();
    expect(boutonNomme(wrapper, 'Publier')).toBeUndefined();
  });

  it('interdit à la scolarité de valider une grille incomplète', async () => {
    const transition = vi.spyOn(noteApi, 'changerStatutNotes');
    const wrapper = await monter('SCOLARITE');

    const valider = boutonNomme(wrapper, 'Valider la grille');
    expect(valider.attributes('disabled')).toBeDefined();
    expect(transition).not.toHaveBeenCalled();
  });

  it('valide quand la grille est complète et conforme', async () => {
    const transition = vi
      .spyOn(noteApi, 'changerStatutNotes')
      .mockResolvedValue({ success: true, data: { statut: 'VALIDEE', count: 3 } });

    const wrapper = await monter('SCOLARITE', {
      success: true,
      data: ETUDIANTS.data.map((etudiant, index) => ({
        note_id: `n${index}`,
        valeur: '12.00',
        statut: 'SAISIE',
        commentaire: null,
        matricule: etudiant.matricule,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
      })),
    });

    expect(wrapper.text()).toContain('Grille conforme');
    await boutonNomme(wrapper, 'Valider la grille').trigger('click');
    await flushPromises();

    expect(transition).toHaveBeenCalledWith('ev1', 'VALIDEE');
  });

  it('rend la grille publiée non modifiable, y compris pour un rôle de saisie', async () => {
    const wrapper = await monter('SCOLARITE', {
      success: true,
      data: ETUDIANTS.data.map((etudiant, index) => ({
        note_id: `n${index}`,
        valeur: '12.00',
        statut: 'PUBLIEE',
        commentaire: null,
        matricule: etudiant.matricule,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
      })),
    });

    expect(wrapper.findAll('input[type="number"]')).toHaveLength(0);
  });

  it('n’offre au directeur que la publication, et seulement sur une grille validée', async () => {
    const wrapper = await monter('DIRECTEUR', {
      success: true,
      data: ETUDIANTS.data.map((etudiant, index) => ({
        note_id: `n${index}`,
        valeur: '12.00',
        statut: 'VALIDEE',
        commentaire: null,
        matricule: etudiant.matricule,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
      })),
    });

    expect(boutonNomme(wrapper, 'Enregistrer')).toBeUndefined();
    expect(boutonNomme(wrapper, 'Valider la grille')).toBeUndefined();
    expect(boutonNomme(wrapper, 'Publier').attributes('disabled')).toBeUndefined();
  });
});
