import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { genererBulletins, getBulletinsClasse, getStatistiquesResultats } from './api';
import { TRANCHES } from './constants';

/** `pg` sert ses `NUMERIC` en chaînes, et `AVG` d'un ensemble vide vaut `null`. */
const nombre = (valeur) => Number(valeur ?? 0) || 0;

const SYNTHESE_VIDE = {
  effectif: 0,
  moyenne: null,
  moyenne_min: null,
  moyenne_max: null,
  admis: 0,
  rattrapages: 0,
  publies: 0,
  credits_acquis: 0,
};

/**
 * Store des statistiques de résultats.
 *
 * Un seul appel serveur (`/resultats/statistiques`) rapporte les cinq agrégats :
 * synthèse, distribution, décisions, mentions et palmarès par classe. Le filtre
 * est porté par le store, si bien que les onglets partagent le même périmètre —
 * changer de classe dans un onglet ne laisse pas les autres sur l'ancien.
 */
export const useStatsStore = defineStore('stats', {
  state: () => ({
    /** Périmètre courant. `null` partout = tous les bulletins. */
    filtres: { classeId: null, semestreId: null, anneeId: null, filiereId: null },

    synthese: { ...SYNTHESE_VIDE },
    /** @type {Array<{tranche: string, effectif: number}>} */
    distribution: [],
    /** @type {Array<{decision: string, effectif: number}>} */
    decisions: [],
    /** @type {Array<{mention: string, effectif: number}>} */
    mentions: [],
    /** @type {Array<object>} */
    parClasse: [],
    /** @type {Array<object>} Palmarès de la classe filtrée, chargé à la demande. */
    bulletins: [],

    loading: false,
    generation: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** Y a-t-il quoi que ce soit à afficher ? */
    estVide: (state) => state.synthese.effectif === 0,

    /**
     * La distribution complétée des tranches vides.
     *
     * Le `GROUP BY` serveur n'émet que les tranches peuplées : un histogramme
     * bâti dessus aurait des colonnes manquantes plutôt que des colonnes à
     * zéro, et sa forme changerait d'un filtre à l'autre.
     */
    distributionComplete: (state) => {
      const parTranche = new Map(state.distribution.map((d) => [d.tranche, d.effectif]));
      return TRANCHES.map((tranche) => ({ tranche, effectif: parTranche.get(tranche) ?? 0 }));
    },

    /** Taux de réussite, en pourcentage. */
    tauxReussite: (state) =>
      state.synthese.effectif > 0 ? (state.synthese.admis / state.synthese.effectif) * 100 : 0,

    /** Classes triées par moyenne décroissante, moyennes converties. */
    classementClasses: (state) =>
      [...state.parClasse]
        .map((ligne) => ({
          ...ligne,
          effectif: nombre(ligne.effectif),
          admis: nombre(ligne.admis),
          moyenne: ligne.moyenne === null ? null : nombre(ligne.moyenne),
        }))
        .sort((a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1)),

    /** Le calcul des bulletins exige les trois : classe, semestre et année. */
    peutGenerer: (state) =>
      Boolean(state.filtres.classeId && state.filtres.semestreId && state.filtres.anneeId),
  },

  actions: {
    /**
     * @template T
     * @param {() => Promise<T>} call
     * @param {{failure?: string, onSuccess?: (r: T) => void, drapeau?: 'loading'|'generation'}} [options]
     */
    async run(call, { failure, onSuccess, drapeau = 'loading' } = {}) {
      const notifications = useNotificationStore();
      this[drapeau] = true;
      this.error = null;

      try {
        const result = await call();
        await onSuccess?.(result);
        return result;
      } catch (error) {
        this.error = error;
        notifications.notifyError(error, failure);
        return undefined;
      } finally {
        this[drapeau] = false;
      }
    },

    /** Remplace le périmètre et recharge. Les clés absentes sont conservées. */
    async appliquerFiltres(filtres) {
      this.filtres = { ...this.filtres, ...filtres };
      return this.fetchStatistiques();
    },

    async fetchStatistiques() {
      // Les clés nulles ne sont pas transmises : le serveur traite un filtre
      // absent comme « pas de restriction », et non comme « égal à null ».
      const params = Object.fromEntries(
        Object.entries(this.filtres).filter(([, valeur]) => Boolean(valeur))
      );

      return this.run(() => getStatistiquesResultats(params), {
        failure: 'Erreur lors du chargement des statistiques de résultats.',
        onSuccess: (result) => {
          const data = result.data ?? {};
          this.synthese = { ...SYNTHESE_VIDE, ...(data.synthese ?? {}) };
          this.synthese.effectif = nombre(this.synthese.effectif);
          this.synthese.admis = nombre(this.synthese.admis);
          this.synthese.rattrapages = nombre(this.synthese.rattrapages);
          this.synthese.publies = nombre(this.synthese.publies);
          this.synthese.credits_acquis = nombre(this.synthese.credits_acquis);

          this.distribution = (data.distribution ?? []).map((ligne) => ({
            tranche: ligne.tranche,
            effectif: nombre(ligne.effectif),
          }));
          this.decisions = (data.decisions ?? []).map((ligne) => ({
            decision: ligne.decision,
            effectif: nombre(ligne.effectif),
          }));
          this.mentions = (data.mentions ?? []).map((ligne) => ({
            mention: ligne.mention,
            effectif: nombre(ligne.effectif),
          }));
          this.parClasse = data.parClasse ?? [];
        },
      });
    },

    /** Palmarès nominatif de la classe filtrée. */
    async fetchBulletins() {
      const { classeId, semestreId, anneeId } = this.filtres;
      if (!classeId || !semestreId || !anneeId) {
        this.bulletins = [];
        return undefined;
      }

      return this.run(() => getBulletinsClasse(classeId, { semestreId, anneeId }), {
        failure: 'Erreur lors du chargement du palmarès.',
        onSuccess: (result) => {
          this.bulletins = (result.data ?? []).map((bulletin) => ({
            ...bulletin,
            moyenne_generale: nombre(bulletin.moyenne_generale),
            rang_etudiant: nombre(bulletin.rang_etudiant),
            credits_acquis: nombre(bulletin.credits_acquis),
          }));
        },
      });
    },

    /**
     * Lance le calcul des bulletins, puis recharge.
     *
     * Le serveur répond `200` avec `generatedCount: 0` lorsqu'il n'y a rien à
     * calculer — aucune note exploitable, ou bulletins verrouillés. Ce n'est pas
     * un échec, mais l'utilisateur doit le savoir : sans ce message, un clic
     * sans effet passerait pour un succès.
     */
    async genererBulletins() {
      const { classeId, semestreId, anneeId } = this.filtres;
      if (!classeId || !semestreId || !anneeId) return undefined;

      const notifications = useNotificationStore();

      const resultat = await this.run(() => genererBulletins(classeId, { semestreId, anneeId }), {
        failure: 'Erreur lors du calcul des bulletins.',
        drapeau: 'generation',
      });

      if (resultat === undefined) return undefined;

      const nb = nombre(resultat.data?.generatedCount);
      if (nb === 0) {
        notifications.notifyWarning(
          'Aucun bulletin calculé : aucune note exploitable sur cette période, ou bulletins verrouillés.'
        );
      } else {
        notifications.notifySuccess(`${nb} bulletin(s) calculé(s).`);
      }

      await Promise.all([this.fetchStatistiques(), this.fetchBulletins()]);
      return nb;
    },
  },
});
