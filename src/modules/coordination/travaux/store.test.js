import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTravailStore } from './store';
import * as api from './api';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/** Charge utile réelle de `v_finalistes` : un finaliste sans sujet a des `null`. */
const FINALISTES = {
  success: true,
  data: [
    {
      etudiant_id: 'e1',
      matricule: 'ETU-001',
      nom: 'BAVOGUI',
      prenom: 'Koïkoï',
      classe_code: 'GI-L3',
      niveau_ordre: 3,
      duree_annees: 3,
      travail_id: 't1',
      theme: 'Détection d’intrusion',
      statut_travail: 'EN_COURS',
      progression: 60,
      situation: 'STAGE',
      directeur_nom: 'KOUMA',
    },
    {
      etudiant_id: 'e2',
      matricule: 'ETU-002',
      nom: 'CAMARA',
      prenom: 'Ibrahima',
      classe_code: 'GI-L3',
      travail_id: 't2',
      theme: 'Ordonnancement',
      statut_travail: 'ATTRIBUE',
      progression: 20,
      situation: 'RECHERCHE',
      directeur_nom: null,
    },
    {
      etudiant_id: 'e3',
      matricule: 'ETU-003',
      nom: 'SOW',
      prenom: 'Awa',
      classe_code: 'ELEC-L3',
      travail_id: null,
      theme: null,
      statut_travail: null,
      progression: null,
      situation: null,
      directeur_nom: null,
    },
  ],
};

/** `en_retard` est calculé par le serveur, pas par l'écran. */
const TRAVAUX = {
  success: true,
  data: [
    {
      id: 't1',
      etudiant_nom: 'BAVOGUI',
      theme: 'Détection d’intrusion',
      statut: 'EN_COURS',
      directeur_id: 'ens1',
      en_retard: false,
      jours_restants: 30,
    },
    {
      id: 't2',
      etudiant_nom: 'CAMARA',
      theme: 'Ordonnancement',
      statut: 'ATTRIBUE',
      directeur_id: null,
      en_retard: true,
      jours_restants: -5,
    },
  ],
};

describe('travaux de recherche et finalistes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  const charger = async () => {
    vi.spyOn(api.travauxResource, 'list').mockResolvedValue(TRAVAUX);
    vi.spyOn(api, 'getFinalistes').mockResolvedValue(FINALISTES);

    const store = useTravailStore();
    await Promise.all([store.fetchAll(), store.fetchFinalistes()]);
    return store;
  };

  it('isole les finalistes sans sujet — ce sont eux qui bloquent', async () => {
    const store = await charger();

    expect(store.finalistesSansTravail.map((e) => e.matricule)).toEqual(['ETU-003']);
  });

  it('signale les travaux en retard et ceux que personne n’encadre', async () => {
    const store = await charger();

    // Le retard vient du serveur : il change tout seul avec le calendrier, et
    // le recalculer ici donnerait deux vérités.
    expect(store.enRetard.map((t) => t.id)).toEqual(['t2']);
    expect(store.sansDirecteur.map((t) => t.id)).toEqual(['t2']);
  });

  it('répartit les finalistes par situation, `null` compris', async () => {
    const store = await charger();

    // Un étudiant sans situation renseignée compte comme non engagé, il ne
    // disparaît pas du total.
    expect(store.parSituation).toEqual({ STAGE: 1, RECHERCHE: 1, AUCUNE: 1 });
  });

  it('ne moyenne l’avancement que sur les travaux engagés', async () => {
    const store = await charger();

    // (60 + 20) / 2 = 40 : compter le finaliste sans sujet comme un zéro
    // ferait passer un problème d'attribution pour un problème d'avancement.
    expect(store.progressionMoyenne).toBe(40);
  });

  it('n’a rien à moyenner quand aucun sujet n’est attribué', async () => {
    vi.spyOn(api.travauxResource, 'list').mockResolvedValue({ success: true, data: [] });
    vi.spyOn(api, 'getFinalistes').mockResolvedValue({
      success: true,
      data: [FINALISTES.data[2]],
    });

    const store = useTravailStore();
    await Promise.all([store.fetchAll(), store.fetchFinalistes()]);

    expect(store.progressionMoyenne).toBe(0);
    expect(Number.isNaN(store.progressionMoyenne)).toBe(false);
  });

  it('n’envoie que les champs du suivi, jamais le thème', async () => {
    const store = await charger();
    const update = vi
      .spyOn(api.travauxResource, 'update')
      .mockResolvedValue({ success: true, data: { id: 't1' } });

    await store.majSuivi('t1', { progression: 80, situation: 'RECHERCHE' });

    expect(update).toHaveBeenCalledWith('t1', { progression: 80, situation: 'RECHERCHE' });
  });
});
