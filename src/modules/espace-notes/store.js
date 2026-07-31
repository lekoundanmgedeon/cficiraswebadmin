import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  classesResource,
  getClasseModules,
  getClasseStudents,
} from '@/modules/structure-academique/classe/api';
import { sessionsResource } from '@/modules/examens/session/api';
import { epreuvesResource } from '@/modules/examens/epreuve/api';

/**
 * Contexte de travail de l'espace notes : quelle classe, quelle session, quelle
 * évaluation.
 *
 * ## Pourquoi ce store existe
 *
 * Le serveur ne sait pas répondre à « quelles évaluations concernent cette
 * classe ». Une évaluation appartient à un **module** et à une **session**
 * (`evaluations.module_id`, `evaluations.session_id`) ; le lien avec une classe
 * passe par `ModuleClasse`. La jointure se fait donc ici, à partir de deux
 * lectures qui, elles, existent :
 *
 * - `GET /classes/:id/modules` (`v_modules_par_classe`) — les modules enseignés ;
 * - `GET /evaluation` — toutes les évaluations, avec leur module et leur session.
 *
 * ## Et pourquoi la liste des étudiants aussi
 *
 * La grille de notes (`GET …/evaluations/:id/notes`) ne renvoie que les
 * étudiants **qui ont déjà une ligne de note**. Au premier remplissage, elle est
 * donc vide, et personne n'apparaîtrait à l'écran. L'effectif réel vient de
 * `GET /classes/:id/etudiants` (`v_etudiants_par_classe`, restreint à l'année
 * active) ; la saisie en lot crée ensuite les lignes manquantes, par matricule.
 */
export const useEspaceNotesStore = defineStore('espaceNotes', {
  state: () => ({
    /** @type {any[]} */
    classes: [],
    /** @type {any[]} Sessions d'évaluation, tous états confondus. */
    sessions: [],
    /** @type {any[]} Évaluations, toutes sessions confondues. */
    evaluations: [],
    /** @type {any[]} Modules de la classe retenue. */
    modules: [],
    /** @type {any[]} Effectif de la classe retenue, année active. */
    etudiants: [],

    classeId: '',
    sessionId: '',
    evaluationId: '',

    loading: false,
    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /**
     * Sessions ouvertes à la saisie.
     *
     * `CHECK (etat IN ('INACTIVE', 'ACTIVE', 'ARCHIVE'))` : seule `ACTIVE` est
     * en cours. Noter une session archivée n'aurait pas de sens, et noter une
     * session inactive reviendrait à noter avant l'ouverture.
     */
    sessionsActives: (state) =>
      state.sessions.filter((session) => String(session.etat).toUpperCase() === 'ACTIVE'),

    classe: (state) =>
      state.classes.find((classe) => String(classe.id) === String(state.classeId)) ?? null,

    session: (state) =>
      state.sessions.find((session) => String(session.id) === String(state.sessionId)) ?? null,

    evaluation: (state) =>
      state.evaluations.find(
        (evaluation) => String(evaluation.id) === String(state.evaluationId)
      ) ?? null,

    /** Identifiants des modules enseignés dans la classe retenue. */
    moduleIds: (state) => new Set(state.modules.map((module) => String(module.id))),

    /**
     * Les évaluations de la classe pour la session retenue : examens **et**
     * devoirs (`type_eval` vaut `EXAMEN`, `CC`, `TP` ou `PROJET`), tous modules
     * confondus.
     */
    evaluationsClasse() {
      if (!this.classeId || !this.sessionId) return [];

      return this.evaluations
        .filter(
          (evaluation) =>
            String(evaluation.session_id) === String(this.sessionId) &&
            this.moduleIds.has(String(evaluation.module_id))
        )
        .sort((a, b) =>
          `${a.code_module}${a.designation}`.localeCompare(`${b.code_module}${b.designation}`)
        );
    },

    /** Vrai tant qu'on ne peut pas afficher de grille. */
    contexteIncomplet() {
      return !this.classeId || !this.sessionId || !this.evaluationId;
    },
  },

  actions: {
    /**
     * Même contrat que `createCrudStore.run` : `undefined` en cas d'échec.
     * @template T
     * @param {() => Promise<T>} call
     * @param {{failure?: string, onSuccess?: (result: T) => void|Promise<void>}} [options]
     * @returns {Promise<T|undefined>}
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

    /** Les trois lectures de contexte, en parallèle. */
    async fetchContexte() {
      await Promise.all([
        this.run(() => classesResource.list(), {
          failure: 'Erreur lors du chargement des classes.',
          onSuccess: (response) => {
            this.classes = response.data ?? [];
          },
        }),
        this.run(() => sessionsResource.list(), {
          failure: 'Erreur lors du chargement des sessions d’évaluation.',
          onSuccess: (response) => {
            this.sessions = response.data ?? [];
          },
        }),
        this.run(() => epreuvesResource.list(), {
          failure: 'Erreur lors du chargement des évaluations.',
          onSuccess: (response) => {
            this.evaluations = response.data ?? [];
          },
        }),
      ]);

      // Une seule session active dans le cas courant : l'ouvrir d'emblée évite
      // un clic qui n'apprend rien.
      if (!this.sessionId) this.sessionId = this.sessionsActives[0]?.id ?? '';
    },

    /**
     * Change de classe : recharge ses modules et son effectif.
     * @param {string} classeId
     */
    async selectClasse(classeId) {
      this.classeId = classeId ?? '';
      this.evaluationId = '';
      this.modules = [];
      this.etudiants = [];

      if (!this.classeId) return;

      await Promise.all([
        this.run(() => getClasseModules(this.classeId), {
          failure: 'Erreur lors du chargement des modules de la classe.',
          onSuccess: (response) => {
            this.modules = response.data ?? [];
          },
        }),
        this.run(() => getClasseStudents(this.classeId), {
          failure: 'Erreur lors du chargement de l’effectif de la classe.',
          onSuccess: (response) => {
            this.etudiants = response.data ?? [];
          },
        }),
      ]);
    },

    /** @param {string} sessionId */
    selectSession(sessionId) {
      this.sessionId = sessionId ?? '';
      // Une évaluation appartient à une session : changer de session invalide
      // celle qui était retenue.
      this.evaluationId = '';
    },

    /** @param {string} evaluationId */
    selectEvaluation(evaluationId) {
      this.evaluationId = evaluationId ?? '';
    },
  },
});
