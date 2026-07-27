import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { getEmploiDuTempsGeneral } from './api';
import { JOURS, ordreJour } from './constants';

/**
 * Store de l'emploi du temps général.
 *
 * Lecture seule : la saisie des créneaux reste dans `pedagogies/crenaux`. Le
 * filtre est porté ici, si bien que la grille et la liste par jour partagent
 * toujours le même périmètre.
 */
export const useEmploiDuTempsStore = defineStore('pedagogieEmploiDuTemps', {
  state: () => ({
    /** Périmètre courant. `null` = pas de restriction. */
    filtres: {
      anneeId: null,
      cycleId: null,
      filiereId: null,
      classeId: null,
      semestreId: null,
    },

    /** @type {Array<object>} Créneaux du périmètre, tels que servis par la vue. */
    creneaux: [],
    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    estVide: (state) => state.creneaux.length === 0,

    /**
     * Créneaux regroupés par jour, dans l'ordre de la semaine.
     *
     * Tous les jours ouvrés sont présents, même vides : les onglets ne doivent
     * pas apparaître et disparaître au gré des filtres.
     *
     * @returns {Array<{id: string, label: string, creneaux: Array<object>}>}
     */
    parJour: (state) =>
      JOURS.map((jour) => ({
        ...jour,
        creneaux: state.creneaux
          .filter((c) => String(c.jour ?? '').toUpperCase() === jour.id)
          .sort((a, b) => String(a.heure_debut).localeCompare(String(b.heure_debut))),
      })),

    /** Les classes présentes dans le périmètre, pour les colonnes de la grille. */
    classesPresentes: (state) => {
      const vues = new Map();
      for (const creneau of state.creneaux) {
        if (!creneau.classe_code || vues.has(creneau.classe_code)) continue;
        vues.set(creneau.classe_code, {
          code: creneau.classe_code,
          id: creneau.classe_id,
          filiere: creneau.filiere,
          cycle: creneau.cycle_code,
          niveau: creneau.niveau,
        });
      }
      return [...vues.values()].sort((a, b) => a.code.localeCompare(b.code));
    },

    /**
     * Les créneaux regroupés par cycle puis par filière puis par classe.
     *
     * C'est la lecture « générale » demandée : voir d'un coup d'œil ce que
     * couvre une année académique, tous cycles confondus.
     */
    parCycleFiliereClasse: (state) => {
      /** @type {Map<string, Map<string, Map<string, object[]>>>} */
      const cycles = new Map();

      for (const creneau of state.creneaux) {
        const cycle = creneau.cycle_code ?? 'Sans cycle';
        const filiere = creneau.filiere ?? 'Sans filière';
        const classe = creneau.classe_code ?? '—';

        if (!cycles.has(cycle)) cycles.set(cycle, new Map());
        const filieres = cycles.get(cycle);
        if (!filieres.has(filiere)) filieres.set(filiere, new Map());
        const classes = filieres.get(filiere);
        if (!classes.has(classe)) classes.set(classe, []);
        classes.get(classe).push(creneau);
      }

      return [...cycles.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([cycle, filieres]) => ({
          cycle,
          filieres: [...filieres.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([filiere, classes]) => ({
              filiere,
              classes: [...classes.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([classe, creneaux]) => ({
                  classe,
                  creneaux: [...creneaux].sort(
                    (a, b) =>
                      ordreJour(a.jour) - ordreJour(b.jour) ||
                      String(a.heure_debut).localeCompare(String(b.heure_debut))
                  ),
                })),
            })),
        }));
    },

    /** Quelques compteurs, pour l'en-tête. */
    resume: (state) => ({
      creneaux: state.creneaux.length,
      classes: new Set(state.creneaux.map((c) => c.classe_code).filter(Boolean)).size,
      filieres: new Set(state.creneaux.map((c) => c.filiere).filter(Boolean)).size,
      enseignants: new Set(state.creneaux.map((c) => c.enseignant_id).filter(Boolean)).size,
    }),
  },

  actions: {
    /**
     * @template T
     * @param {() => Promise<T>} call
     * @param {{failure?: string, onSuccess?: (r: T) => void}} [options]
     */
    async run(call, { failure, onSuccess } = {}) {
      const notifications = useNotificationStore();
      this.loading = true;
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
        this.loading = false;
      }
    },

    /** Remplace une partie du périmètre et recharge. */
    async appliquerFiltres(filtres) {
      this.filtres = { ...this.filtres, ...filtres };
      return this.fetchCreneaux();
    },

    async fetchCreneaux() {
      // Un filtre nul ne doit pas être transmis : le serveur traite l'absence
      // comme « pas de restriction », et non comme « égal à null ».
      const params = Object.fromEntries(
        Object.entries(this.filtres).filter(([, valeur]) => Boolean(valeur))
      );

      return this.run(() => getEmploiDuTempsGeneral(params), {
        failure: "Erreur lors du chargement de l'emploi du temps.",
        onSuccess: (result) => {
          // Cette route répond un **tableau brut**, sans enveloppe `{success,
          // data}` — contrairement au reste de l'API. Le repli couvre les deux
          // formes, au cas où le backend serait un jour harmonisé.
          this.creneaux = Array.isArray(result) ? result : (result?.data ?? []);
        },
      });
    },
  },
});
