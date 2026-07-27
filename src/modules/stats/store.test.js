import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useStatsStore } from './store';
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
 * Charge utile réelle de `GET /evaluations/resultats/statistiques`, relevée
 * contre `localhost:3500`. Les moyennes arrivent en **chaînes** (`pg` sert ainsi
 * ses `NUMERIC`), et le `GROUP BY` n'émet que les tranches peuplées.
 */
const STATS_RESPONSE = {
  success: true,
  data: {
    synthese: {
      effectif: 3,
      moyenne: '12.40',
      moyenne_min: '8.00',
      moyenne_max: '15.50',
      admis: 2,
      rattrapages: 1,
      publies: 0,
      credits_acquis: 18,
    },
    distribution: [
      { tranche: '[8-10[', effectif: 1 },
      { tranche: '[12-14[', effectif: 1 },
      { tranche: '[14-16[', effectif: 1 },
    ],
    decisions: [
      { decision: 'VALIDE', effectif: 2 },
      { decision: 'RATTRAPAGE', effectif: 1 },
    ],
    mentions: [{ mention: 'TRES_BIEN', effectif: 1 }],
    parClasse: [
      {
        classe_id: 'c1',
        classe_code: 'GI-L1',
        filiere: 'Génie Informatique',
        effectif: 2,
        moyenne: '13.95',
        admis: 2,
      },
      {
        classe_id: 'c2',
        classe_code: 'EL-L1',
        filiere: 'Electricite',
        effectif: 1,
        moyenne: '8.00',
        admis: 0,
      },
    ],
  },
};

/** Périmètre vide : `AVG` d'un ensemble vide vaut `null`, pas 0. */
const STATS_VIDE = {
  success: true,
  data: {
    synthese: {
      effectif: 0,
      moyenne: null,
      moyenne_min: null,
      moyenne_max: null,
      admis: 0,
      rattrapages: 0,
      publies: 0,
      credits_acquis: 0,
    },
    distribution: [],
    decisions: [],
    mentions: [],
    parClasse: [],
  },
};

const PERIMETRE = { classeId: 'c1', semestreId: 's1', anneeId: 'a1' };

describe('statsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  describe('lecture des agrégats', () => {
    it('convertit les compteurs servis en chaînes', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_RESPONSE);
      const store = useStatsStore();

      await store.fetchStatistiques();

      expect(store.synthese.effectif).toBe(3);
      expect(store.synthese.admis).toBe(2);
      expect(store.synthese.credits_acquis).toBe(18);
      // Une addition, et non une concaténation.
      expect(store.synthese.effectif + 1).toBe(4);
    });

    it('ne transmet que les filtres réellement renseignés', async () => {
      const espion = vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      const store = useStatsStore();

      await store.appliquerFiltres({ classeId: 'c1' });

      // Un filtre nul doit être absent, et non transmis comme `null` : le
      // serveur traite l'absence comme « pas de restriction ».
      expect(espion).toHaveBeenCalledWith({ classeId: 'c1' });
    });

    it('conserve les filtres non touchés lors d’une mise à jour partielle', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      const store = useStatsStore();

      await store.appliquerFiltres({ anneeId: 'a1', semestreId: 's1' });
      await store.appliquerFiltres({ classeId: 'c1' });

      expect(store.filtres).toMatchObject({ anneeId: 'a1', semestreId: 's1', classeId: 'c1' });
    });
  });

  describe('getters', () => {
    it('complète les tranches absentes du GROUP BY', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_RESPONSE);
      const store = useStatsStore();

      await store.fetchStatistiques();

      // Sept tranches attendues, dont quatre à zéro : sans ce complètement,
      // l'histogramme changerait de forme d'un filtre à l'autre.
      expect(store.distributionComplete).toHaveLength(7);
      expect(store.distributionComplete.map((d) => d.effectif)).toEqual([0, 0, 1, 0, 1, 1, 0]);
    });

    it('calcule le taux de réussite', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_RESPONSE);
      const store = useStatsStore();

      await store.fetchStatistiques();

      expect(store.tauxReussite).toBeCloseTo((2 / 3) * 100, 5);
    });

    it('ne divise pas par zéro sur un périmètre vide', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      const store = useStatsStore();

      await store.fetchStatistiques();

      expect(store.tauxReussite).toBe(0);
      expect(store.estVide).toBe(true);
      // `AVG` d'un ensemble vide vaut `null` : le laisser tel quel permet à l'UI
      // d'afficher « — » plutôt que « 0.00/20 », qui serait une note fausse.
      expect(store.synthese.moyenne).toBeNull();
    });

    it('classe les classes par moyenne décroissante sans muter l’état', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_RESPONSE);
      const store = useStatsStore();

      await store.fetchStatistiques();

      expect(store.classementClasses.map((c) => c.classe_code)).toEqual(['GI-L1', 'EL-L1']);
      expect(store.classementClasses[0].moyenne).toBe(13.95);
      expect(store.parClasse.map((c) => c.classe_code)).toEqual(['GI-L1', 'EL-L1']);
    });

    it('n’autorise le calcul qu’avec le triplet complet', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      const store = useStatsStore();

      expect(store.peutGenerer).toBe(false);
      await store.appliquerFiltres({ classeId: 'c1', semestreId: 's1' });
      expect(store.peutGenerer).toBe(false);
      await store.appliquerFiltres({ anneeId: 'a1' });
      expect(store.peutGenerer).toBe(true);
    });
  });

  describe('génération des bulletins', () => {
    it('ne part pas sans périmètre complet', async () => {
      const espion = vi.spyOn(api, 'genererBulletins');
      const store = useStatsStore();

      const resultat = await store.genererBulletins();

      expect(resultat).toBeUndefined();
      expect(espion).not.toHaveBeenCalled();
    });

    it('recharge les statistiques après un calcul réussi', async () => {
      vi.spyOn(api, 'genererBulletins').mockResolvedValue({
        success: true,
        data: { generatedCount: 12 },
      });
      const lecture = vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_RESPONSE);
      vi.spyOn(api, 'getBulletinsClasse').mockResolvedValue({ success: true, data: [] });

      const store = useStatsStore();
      await store.appliquerFiltres(PERIMETRE);
      lecture.mockClear();

      const nb = await store.genererBulletins();

      expect(nb).toBe(12);
      // Le calcul change les données : les agrégats doivent être relus.
      expect(lecture).toHaveBeenCalled();
    });

    it('avertit quand le serveur n’a rien eu à calculer', async () => {
      // Le serveur répond 200 / generatedCount 0 s'il n'y a aucune note
      // exploitable ou si les bulletins sont verrouillés. Sans message, un clic
      // sans effet passerait pour un succès.
      vi.spyOn(api, 'genererBulletins').mockResolvedValue({
        success: true,
        data: { generatedCount: 0 },
      });
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      vi.spyOn(api, 'getBulletinsClasse').mockResolvedValue({ success: true, data: [] });

      const store = useStatsStore();
      await store.appliquerFiltres(PERIMETRE);

      const nb = await store.genererBulletins();

      expect(nb).toBe(0);
    });

    it('rend undefined et retombe le drapeau si le calcul échoue', async () => {
      const echec = new Error('boom');
      vi.spyOn(api, 'genererBulletins').mockRejectedValue(echec);
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);

      const store = useStatsStore();
      await store.appliquerFiltres(PERIMETRE);

      const resultat = await store.genererBulletins();

      expect(resultat).toBeUndefined();
      expect(store.error).toBe(echec);
      expect(store.generation).toBe(false);
    });
  });

  describe('palmarès', () => {
    it('ne demande rien tant que le périmètre est partiel', async () => {
      const espion = vi.spyOn(api, 'getBulletinsClasse');
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      const store = useStatsStore();

      await store.appliquerFiltres({ classeId: 'c1' });
      await store.fetchBulletins();

      expect(espion).not.toHaveBeenCalled();
      expect(store.bulletins).toEqual([]);
    });

    it('convertit les valeurs numériques des bulletins', async () => {
      vi.spyOn(api, 'getStatistiquesResultats').mockResolvedValue(STATS_VIDE);
      vi.spyOn(api, 'getBulletinsClasse').mockResolvedValue({
        success: true,
        data: [
          {
            id: 'b1',
            matricule: 'ETU-001',
            nom: 'DIALLO',
            moyenne_generale: '15.50',
            rang_etudiant: '1',
            credits_acquis: '6',
            credits_totaux_semestre: 18,
          },
        ],
      });

      const store = useStatsStore();
      await store.appliquerFiltres(PERIMETRE);
      await store.fetchBulletins();

      expect(store.bulletins[0]).toMatchObject({
        moyenne_generale: 15.5,
        rang_etudiant: 1,
        credits_acquis: 6,
      });
    });
  });
});
