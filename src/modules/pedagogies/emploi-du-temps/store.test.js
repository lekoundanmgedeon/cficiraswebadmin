import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useEmploiDuTempsStore } from './store';
import * as api from './api';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Charge utile réelle de `GET /pedagogies/schedule/general`, relevée contre
 * `localhost:3500`.
 *
 * Deux points que ces tests verrouillent :
 * - la route répond un **tableau brut**, sans enveloppe `{success, data}` ;
 * - `jour` est servi en **majuscules** (`'LUNDI'`), le backend le dérivant de la
 *   date à l'écriture. L'ancien écran comparait à `'lundi'` en minuscules.
 */
const CRENEAUX = [
  {
    id: 'c1',
    jour: 'LUNDI',
    heure_debut: '08:00:00',
    heure_fin: '10:00:00',
    type_cours: 'CM',
    classe_code: 'GI-L1',
    classe_id: 'cl1',
    niveau: 'L1',
    filiere: 'Génie Informatique',
    filiere_id: 'f1',
    cycle_code: 'LMD-L',
    cycle_id: 'cy1',
    annee_code: '2024-2025',
    semestre: 'S1',
    nom_module: 'Algorithmique',
    enseignant: 'Alice MBEMBA',
    enseignant_id: 'e1',
    salle_nom: '101',
  },
  {
    id: 'c2',
    jour: 'MERCREDI',
    heure_debut: '14:00:00',
    heure_fin: '16:00:00',
    type_cours: 'TD',
    classe_code: 'GI-L1',
    classe_id: 'cl1',
    filiere: 'Génie Informatique',
    filiere_id: 'f1',
    cycle_code: 'LMD-L',
    cycle_id: 'cy1',
    semestre: 'S1',
    nom_module: 'Algorithmique',
    enseignant: 'Alice MBEMBA',
    enseignant_id: 'e1',
    salle_nom: '101',
  },
  {
    id: 'c3',
    jour: 'LUNDI',
    heure_debut: '06:00:00',
    heure_fin: '08:00:00',
    type_cours: 'TP',
    classe_code: 'EL-L1',
    classe_id: 'cl2',
    filiere: 'Electricite',
    filiere_id: 'f2',
    cycle_code: 'LMD-L',
    cycle_id: 'cy1',
    semestre: 'S1',
    nom_module: 'Circuits',
    enseignant: 'Bob NKOU',
    enseignant_id: 'e2',
    salle_nom: '202',
  },
];

describe('emploiDuTempsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  describe('lecture', () => {
    it('lit le tableau brut servi par la route', async () => {
      // Cette route de `/pedagogies/schedule` n'utilise pas l'enveloppe
      // `{success, data}` du reste de l'API : lire `result.data` donnerait
      // `undefined`, et l'écran resterait vide sans erreur.
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue(CRENEAUX);
      const store = useEmploiDuTempsStore();

      await store.fetchCreneaux();

      expect(store.creneaux).toHaveLength(3);
      expect(store.estVide).toBe(false);
    });

    it('accepte aussi la forme enveloppée, si le backend est harmonisé', async () => {
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue({
        success: true,
        data: CRENEAUX,
      });
      const store = useEmploiDuTempsStore();

      await store.fetchCreneaux();

      expect(store.creneaux).toHaveLength(3);
    });

    it('ne transmet que les filtres renseignés', async () => {
      const espion = vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue([]);
      const store = useEmploiDuTempsStore();

      await store.appliquerFiltres({ anneeId: 'a1', cycleId: 'cy1' });

      expect(espion).toHaveBeenCalledWith({ anneeId: 'a1', cycleId: 'cy1' });
    });

    it('rend undefined et retombe le drapeau en cas d’échec', async () => {
      const echec = new Error('boom');
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockRejectedValue(echec);
      const store = useEmploiDuTempsStore();

      const resultat = await store.fetchCreneaux();

      expect(resultat).toBeUndefined();
      expect(store.error).toBe(echec);
      expect(store.loading).toBe(false);
    });
  });

  describe('regroupement par jour', () => {
    it('expose les six jours ouvrés, même vides', async () => {
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue(CRENEAUX);
      const store = useEmploiDuTempsStore();
      await store.fetchCreneaux();

      // Les onglets ne doivent pas apparaître et disparaître selon les filtres.
      expect(store.parJour).toHaveLength(6);
      expect(store.parJour.map((j) => j.label)).toEqual([
        'Lundi',
        'Mardi',
        'Mercredi',
        'Jeudi',
        'Vendredi',
        'Samedi',
      ]);
    });

    it('rapproche les jours servis en majuscules', async () => {
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue(CRENEAUX);
      const store = useEmploiDuTempsStore();
      await store.fetchCreneaux();

      const lundi = store.parJour.find((j) => j.id === 'LUNDI');
      expect(lundi.creneaux).toHaveLength(2);
      const mercredi = store.parJour.find((j) => j.id === 'MERCREDI');
      expect(mercredi.creneaux).toHaveLength(1);
      const mardi = store.parJour.find((j) => j.id === 'MARDI');
      expect(mardi.creneaux).toHaveLength(0);
    });

    it('trie les créneaux d’un jour par heure de début', async () => {
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue(CRENEAUX);
      const store = useEmploiDuTempsStore();
      await store.fetchCreneaux();

      const lundi = store.parJour.find((j) => j.id === 'LUNDI');
      expect(lundi.creneaux.map((c) => c.heure_debut)).toEqual(['06:00:00', '08:00:00']);
    });
  });

  describe('regroupement par cycle, filière et classe', () => {
    it('imbrique les trois niveaux', async () => {
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue(CRENEAUX);
      const store = useEmploiDuTempsStore();
      await store.fetchCreneaux();

      const arbre = store.parCycleFiliereClasse;
      expect(arbre).toHaveLength(1);
      expect(arbre[0].cycle).toBe('LMD-L');
      expect(arbre[0].filieres.map((f) => f.filiere)).toEqual([
        'Electricite',
        'Génie Informatique',
      ]);
      expect(arbre[0].filieres[1].classes[0].classe).toBe('GI-L1');
      expect(arbre[0].filieres[1].classes[0].creneaux).toHaveLength(2);
    });

    it('range les créneaux sans contexte sous un libellé explicite', async () => {
      // Une classe supprimée après coup laisse un créneau orphelin : la vue
      // renvoie alors `cycle_code` et `filiere` nuls. Le grouper sous
      // `undefined` produirait un en-tête vide.
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue([
        { id: 'x', jour: 'LUNDI', classe_code: null, cycle_code: null, filiere: null },
      ]);
      const store = useEmploiDuTempsStore();
      await store.fetchCreneaux();

      expect(store.parCycleFiliereClasse[0].cycle).toBe('Sans cycle');
      expect(store.parCycleFiliereClasse[0].filieres[0].filiere).toBe('Sans filière');
    });

    it('ordonne les créneaux d’une classe par jour puis par heure', async () => {
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue(CRENEAUX);
      const store = useEmploiDuTempsStore();
      await store.fetchCreneaux();

      const gi = store.parCycleFiliereClasse[0].filieres.find(
        (f) => f.filiere === 'Génie Informatique'
      );
      expect(gi.classes[0].creneaux.map((c) => c.jour)).toEqual(['LUNDI', 'MERCREDI']);
    });
  });

  describe('résumé', () => {
    it('compte les entités distinctes du périmètre', async () => {
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue(CRENEAUX);
      const store = useEmploiDuTempsStore();
      await store.fetchCreneaux();

      expect(store.resume).toEqual({
        creneaux: 3,
        classes: 2,
        filieres: 2,
        enseignants: 2,
      });
    });

    it('ne compte rien sur un périmètre vide', async () => {
      vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue([]);
      const store = useEmploiDuTempsStore();
      await store.fetchCreneaux();

      expect(store.estVide).toBe(true);
      expect(store.resume).toEqual({ creneaux: 0, classes: 0, filieres: 0, enseignants: 0 });
    });
  });
});
