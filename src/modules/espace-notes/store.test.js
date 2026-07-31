import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import * as classeApi from '@/modules/structure-academique/classe/api';
import * as sessionApi from '@/modules/examens/session/api';
import * as epreuveApi from '@/modules/examens/epreuve/api';
import { useEspaceNotesStore } from './store';

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
  data: [
    {
      id: 'c1',
      code: 'GI-L1',
      filiere_nom: 'Génie Informatique',
      niveau_code: 'L1',
      nb_etudiants: 2,
    },
  ],
};

/** Deux sessions, une seule ouverte à la saisie. */
const SESSIONS = {
  success: true,
  data: [
    { id: 's-archive', code: 'S1-2024', designation: 'Session close', etat: 'ARCHIVE' },
    { id: 's-active', code: 'S1', designation: 'Session normale', etat: 'ACTIVE' },
    { id: 's-inactive', code: 'S2', designation: 'À venir', etat: 'INACTIVE' },
  ],
};

/** `m1` est enseigné dans la classe, `m9` ne l'est pas. */
const EVALUATIONS = {
  success: true,
  data: [
    {
      id: 'e1',
      module_id: 'm1',
      session_id: 's-active',
      type_eval: 'EXAMEN',
      designation: 'Examen final',
      code_module: 'ALG1',
    },
    {
      id: 'e2',
      module_id: 'm1',
      session_id: 's-active',
      type_eval: 'CC',
      designation: 'Devoir 1',
      code_module: 'ALG1',
    },
    {
      id: 'e3',
      module_id: 'm9',
      session_id: 's-active',
      type_eval: 'EXAMEN',
      designation: 'Examen d’une autre classe',
      code_module: 'ZZZ',
    },
    {
      id: 'e4',
      module_id: 'm1',
      session_id: 's-inactive',
      type_eval: 'EXAMEN',
      designation: 'Session non ouverte',
      code_module: 'ALG1',
    },
  ],
};

const MODULES = {
  success: true,
  data: [{ id: 'm1', code: 'ALG1', designation: 'Algorithmique', semestre_id: 'sem1' }],
};

const ETUDIANTS = {
  success: true,
  data: [
    { id: 'et1', matricule: 'ETU-001', nom: 'Ndiaye', prenom: 'Fatou' },
    { id: 'et2', matricule: 'ETU-002', nom: 'Camara', prenom: 'Ibrahima' },
  ],
};

describe('contexte de l’espace notes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const charger = async () => {
    vi.spyOn(classeApi.classesResource, 'list').mockResolvedValue(CLASSES);
    vi.spyOn(sessionApi.sessionsResource, 'list').mockResolvedValue(SESSIONS);
    vi.spyOn(epreuveApi.epreuvesResource, 'list').mockResolvedValue(EVALUATIONS);
    vi.spyOn(classeApi, 'getClasseModules').mockResolvedValue(MODULES);
    vi.spyOn(classeApi, 'getClasseStudents').mockResolvedValue(ETUDIANTS);

    const store = useEspaceNotesStore();
    await store.fetchContexte();
    return store;
  };

  it('ne propose à la saisie que les sessions actives, et ouvre la première', async () => {
    const store = await charger();

    expect(store.sessionsActives.map((session) => session.id)).toEqual(['s-active']);
    expect(store.sessionId).toBe('s-active');
  });

  it('recoupe modules de la classe et évaluations pour répondre à une question que le serveur ignore', async () => {
    const store = await charger();
    await store.selectClasse('c1');

    // Une évaluation appartient à un module et à une session ; son lien avec la
    // classe passe par `ModuleClasse`. La jointure est faite ici.
    expect(store.evaluationsClasse.map((evaluation) => evaluation.id)).toEqual(['e2', 'e1']);
    // `e3` appartient à un module non enseigné dans la classe, `e4` à une
    // session qui n'est pas ouverte.
    expect(store.evaluationsClasse.map((e) => e.id)).not.toContain('e3');
    expect(store.evaluationsClasse.map((e) => e.id)).not.toContain('e4');
  });

  it("charge l'effectif de la classe, que la grille de notes ne donne pas", async () => {
    const store = await charger();
    await store.selectClasse('c1');

    // `GET …/notes` ne renvoie que les étudiants déjà notés : au premier
    // remplissage, l'effectif ne peut venir que d'ici.
    expect(store.etudiants.map((etudiant) => etudiant.matricule)).toEqual(['ETU-001', 'ETU-002']);
  });

  it('oublie l’évaluation retenue dès que le contexte change', async () => {
    const store = await charger();
    await store.selectClasse('c1');
    store.selectEvaluation('e1');
    expect(store.contexteIncomplet).toBe(false);

    store.selectSession('s-inactive');
    expect(store.evaluationId).toBe('');
    expect(store.contexteIncomplet).toBe(true);

    store.selectSession('s-active');
    store.selectEvaluation('e1');
    await store.selectClasse('c1');
    expect(store.evaluationId).toBe('');
  });

  it('ne cherche pas d’évaluations tant que la classe n’est pas choisie', async () => {
    const store = await charger();
    expect(store.evaluationsClasse).toEqual([]);
    expect(store.contexteIncomplet).toBe(true);
  });
});
