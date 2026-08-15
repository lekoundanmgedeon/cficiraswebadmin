import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { toast } from 'vue3-toastify';
import { useEpreuveStore } from './store';
import * as api from './api';

// La fabrique de `vi.mock` est hissée en tête de fichier : elle ne peut pas
// refermer sur une variable déclarée ici.
vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/** Deux lignes prêtes à être créées, telles que la modale les prépare. */
const LIGNES = [
  {
    numero: 2,
    libelle: 'Examen final — Algo',
    payload: { session_id: 's1', module_id: 'm1', type_eval: 'EXAMEN', ponderation: 60 },
  },
  {
    numero: 3,
    libelle: 'Contrôle continu — Algo',
    payload: { session_id: 's1', module_id: 'm1', type_eval: 'CC', ponderation: 40 },
  },
];

describe('store des épreuves — import de planning', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monterStore = () => {
    // L'import recharge la liste une fois à la fin.
    vi.spyOn(api.epreuvesResource, 'list').mockResolvedValue({ success: true, data: [] });
    return useEpreuveStore();
  };

  it('crée les lignes une par une et rend un compte rendu de la même forme que le serveur', async () => {
    const create = vi
      .spyOn(api.epreuvesResource, 'create')
      .mockResolvedValue({ success: true, data: { id: 'e1' } });

    const store = monterStore();
    const report = await store.importPlanning(LIGNES);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(1, LIGNES[0].payload);
    expect(report.summary).toEqual({ totalTraite: 2, totalSucces: 2, totalEchecs: 0 });
    expect(report.details.echecs).toEqual([]);
  });

  it('ne notifie qu’une fois, et non à chaque ligne', async () => {
    vi.spyOn(api.epreuvesResource, 'create').mockResolvedValue({ success: true, data: {} });

    const store = monterStore();
    await store.importPlanning(LIGNES);

    // `create()` de la fabrique aurait notifié — et rechargé la liste — deux fois.
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success.mock.calls[0][0]).toContain('2/2');
  });

  it('rattache chaque échec à sa ligne du classeur, et poursuit l’import', async () => {
    vi.spyOn(api.epreuvesResource, 'create')
      .mockRejectedValueOnce(new Error('Pondération invalide'))
      .mockResolvedValueOnce({ success: true, data: {} });

    const store = monterStore();
    const report = await store.importPlanning(LIGNES);

    expect(report.summary).toEqual({ totalTraite: 2, totalSucces: 1, totalEchecs: 1 });
    expect(report.details.echecs).toEqual([
      { ligne: 2, epreuve: 'Examen final — Algo', erreur: 'Pondération invalide' },
    ]);
    // Un import partiel avertit, il n'annonce pas un succès.
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('reprend les lignes écartées avant l’envoi dans le même compte rendu', async () => {
    const create = vi
      .spyOn(api.epreuvesResource, 'create')
      .mockResolvedValue({ success: true, data: {} });

    const store = monterStore();
    const report = await store.importPlanning(
      [LIGNES[1]],
      [{ ligne: 2, epreuve: 'Examen final — Algo', erreur: 'code_module « ZZZ » introuvable' }]
    );

    expect(create).toHaveBeenCalledTimes(1); // la ligne écartée n'est pas envoyée
    expect(report.summary).toEqual({ totalTraite: 2, totalSucces: 1, totalEchecs: 1 });
    // Les échecs sont rendus dans l'ordre du classeur, quelle que soit leur origine.
    expect(report.details.echecs[0].ligne).toBe(2);
  });

  it('ne recharge pas la liste quand rien n’a pu être créé', async () => {
    const list = vi.spyOn(api.epreuvesResource, 'list').mockResolvedValue({
      success: true,
      data: [],
    });

    const store = useEpreuveStore();
    const report = await store.importPlanning(
      [],
      [{ ligne: 2, epreuve: '—', erreur: 'code_session introuvable' }]
    );

    expect(list).not.toHaveBeenCalled();
    expect(report.summary).toEqual({ totalTraite: 1, totalSucces: 0, totalEchecs: 1 });
  });

  it('efface son compte rendu à la fermeture de la modale', async () => {
    vi.spyOn(api.epreuvesResource, 'create').mockResolvedValue({ success: true, data: {} });

    const store = monterStore();
    await store.importPlanning(LIGNES);
    expect(store.importReport).not.toBeNull();

    store.clearImportReport();
    expect(store.importReport).toBeNull();
  });
});
