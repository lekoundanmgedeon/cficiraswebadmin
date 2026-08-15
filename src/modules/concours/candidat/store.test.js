import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCandidatStore } from './store';
import * as api from './api';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const reponse = (note) => ({
  success: true,
  data: [{ num_table: 'T-0001', nom: 'NIANGA', note }],
});

describe('store des candidats — notes par épreuve', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('ne redemande pas une épreuve déjà chargée', async () => {
    const appel = vi.spyOn(api, 'getCandidatsByEpreuve').mockResolvedValue(reponse('12.00'));
    const store = useCandidatStore();

    await store.fetchNotesEpreuve('c1', 'CG');
    await store.fetchNotesEpreuve('c1', 'CG');

    expect(appel).toHaveBeenCalledTimes(1);
    expect(store.notesParEpreuve.CG).toHaveLength(1);
  });

  it('relit quand on force — après un enregistrement, par exemple', async () => {
    const appel = vi.spyOn(api, 'getCandidatsByEpreuve').mockResolvedValue(reponse('12.00'));
    const store = useCandidatStore();

    await store.fetchNotesEpreuve('c1', 'CG');
    await store.fetchNotesEpreuve('c1', 'CG', { force: true });

    expect(appel).toHaveBeenCalledTimes(2);
  });

  it('ne sert pas les notes d’un concours pour un autre portant le même code d’épreuve', async () => {
    const appel = vi
      .spyOn(api, 'getCandidatsByEpreuve')
      .mockResolvedValueOnce(reponse('12.00'))
      .mockResolvedValueOnce(reponse('7.00'));

    const store = useCandidatStore();

    await store.fetchNotesEpreuve('c1', 'CG');
    expect(store.notesParEpreuve.CG[0].note).toBe('12.00');

    // Deux concours peuvent tous deux avoir une épreuve « CG » : le cache doit
    // être vidé, sans quoi le second afficherait les notes du premier.
    await store.fetchNotesEpreuve('c2', 'CG');

    expect(appel).toHaveBeenCalledTimes(2);
    expect(store.notesParEpreuve.CG[0].note).toBe('7.00');
    expect(store.notesConcoursId).toBe('c2');
  });

  it('oublie les notes après un import, que le serveur vient de remplacer', async () => {
    vi.spyOn(api, 'getCandidatsByEpreuve').mockResolvedValue(reponse('12.00'));
    vi.spyOn(api, 'importNotes').mockResolvedValue({ success: true, data: { summary: {} } });

    const store = useCandidatStore();
    await store.fetchNotesEpreuve('c1', 'CG');
    expect(store.notesParEpreuve.CG).toBeDefined();

    await store.importNotesFile(new File(['x'], 'notes.xlsx'), 'c1');
    expect(store.notesParEpreuve).toEqual({});
  });
});
