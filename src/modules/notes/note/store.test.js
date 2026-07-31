import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNoteStore } from './store';
import * as api from './api';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/** Charge utile réelle de `GET /notes/evaluations/:id/notes`. */
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
    {
      note_id: 'n2',
      valeur: '08.50',
      statut: 'SAISIE',
      commentaire: null,
      matricule: 'ETU-002',
      nom: 'Camara',
      prenom: 'Ibrahima',
    },
  ],
};

const GRILLE_MIXTE = {
  success: true,
  data: [
    { ...GRILLE.data[0], statut: 'VALIDEE' },
    { ...GRILLE.data[1], statut: 'SAISIE' },
  ],
};

describe('store des notes — saisie et flux de statut', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('crée les notes manquantes par saisie en lot, puis relit la grille', async () => {
    const saisie = vi.spyOn(api, 'saisirNotesBatch').mockResolvedValue({
      success: true,
      data: { total_traite: 2, total_succes: 2, total_echecs: 0, erreurs: [] },
    });
    const lecture = vi.spyOn(api, 'getNotesByEvaluation').mockResolvedValue(GRILLE);

    const store = useNoteStore();
    const rapport = await store.saisirLot('ev1', [
      { matricule: 'ETU-001', note: 14, commentaire: null },
      { matricule: 'ETU-002', note: 8.5, commentaire: null },
    ]);

    // Le serveur désigne les étudiants par matricule : c'est le contrat de
    // `importer_notes_batch`, seul chemin capable de créer une ligne de note.
    expect(saisie).toHaveBeenCalledWith('ev1', [
      { matricule: 'ETU-001', note: 14, commentaire: null },
      { matricule: 'ETU-002', note: 8.5, commentaire: null },
    ]);
    expect(rapport.total_succes).toBe(2);
    expect(lecture).toHaveBeenCalledWith('ev1');
    expect(store.items).toHaveLength(2);
  });

  it('remonte le rapport d’échecs plutôt que d’annoncer un succès plein', async () => {
    vi.spyOn(api, 'saisirNotesBatch').mockResolvedValue({
      success: true,
      data: {
        total_traite: 2,
        total_succes: 1,
        total_echecs: 1,
        erreurs: [{ matricule: 'INCONNU', erreur: 'Étudiant introuvable en base' }],
      },
    });
    vi.spyOn(api, 'getNotesByEvaluation').mockResolvedValue(GRILLE);

    const store = useNoteStore();
    const rapport = await store.saisirLot('ev1', [{ matricule: 'INCONNU', note: 12 }]);

    expect(rapport.total_echecs).toBe(1);
    expect(rapport.erreurs[0].matricule).toBe('INCONNU');
  });

  it('n’envoie rien quand il n’y a rien à envoyer', async () => {
    const saisie = vi.spyOn(api, 'saisirNotesBatch');
    const store = useNoteStore();

    expect(await store.saisirLot('ev1', [])).toBeUndefined();
    expect(await store.saisirLot('', [{ matricule: 'ETU-001', note: 10 }])).toBeUndefined();
    expect(saisie).not.toHaveBeenCalled();
  });

  it('fait avancer le statut, puis relit — la grille du serveur fait foi', async () => {
    vi.spyOn(api, 'getNotesByEvaluation').mockResolvedValue(GRILLE);
    const transition = vi
      .spyOn(api, 'changerStatutNotes')
      .mockResolvedValue({ success: true, data: { statut: 'VALIDEE', count: 2 } });

    const store = useNoteStore();
    await store.fetchByEvaluation('ev1');
    await store.changerStatut('VALIDEE');

    expect(transition).toHaveBeenCalledWith('ev1', 'VALIDEE');
    expect(api.getNotesByEvaluation).toHaveBeenCalledTimes(2);
  });

  it('ne tente aucune transition sans évaluation consultée', async () => {
    const transition = vi.spyOn(api, 'changerStatutNotes');
    const store = useNoteStore();

    expect(await store.changerStatut('VALIDEE')).toBeUndefined();
    expect(transition).not.toHaveBeenCalled();
  });

  it('retient le statut le plus faible de la grille', async () => {
    vi.spyOn(api, 'getNotesByEvaluation').mockResolvedValue(GRILLE_MIXTE);

    const store = useNoteStore();
    await store.fetchByEvaluation('ev1');

    // Une seule note repassée en saisie suffit à déclasser la grille : c'est
    // aussi ce que fait le serveur, qui ne déplace que les notes éligibles.
    expect(store.parStatut).toEqual({ SAISIE: 1, VALIDEE: 1, PUBLIEE: 0 });
    expect(store.statutGlobal).toBe('SAISIE');
  });

  it('n’a pas de statut global sans note', () => {
    const store = useNoteStore();
    expect(store.statutGlobal).toBeNull();
    expect(store.parStatut).toEqual({ SAISIE: 0, VALIDEE: 0, PUBLIEE: 0 });
  });
});
