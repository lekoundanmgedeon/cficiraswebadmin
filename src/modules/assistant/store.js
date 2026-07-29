import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { getCatalogue, getConversations, getSante, poserQuestion } from './api';

/**
 * Store de l'assistant IA.
 *
 * ## Le fil est local, pas rechargé
 *
 * Le backend journalise chaque échange, mais n'expose pas le détail d'un fil :
 * `GET /conversations` ne rend que des en-têtes (titre, nombre d'échanges,
 * dernière activité). Le fil affiché est donc celui de la session courante.
 *
 * C'est un choix assumé et non un oubli : recharger une conversation d'hier
 * afficherait des chiffres périmés — un effectif, un montant encaissé, un taux
 * de recouvrement changent. Mieux vaut reposer la question que faire croire à
 * une réponse encore valable.
 */
export const useAssistantStore = defineStore('assistant', {
  state: () => ({
    /**
     * Le fil courant.
     * @type {Array<{role: 'user'|'assistant', texte: string, requetes?: Array<object>,
     *   aboutie?: boolean, dureeMs?: number, horodatage: string}>}
     */
    messages: [],

    /** Fil serveur en cours. `null` = la prochaine question en ouvrira un. */
    conversationId: null,

    /** @type {Array<{conversation_id: string, titre: string, nb_echanges: number}>} */
    conversations: [],

    /** @type {{disponible: boolean, modele: object, sources: object}|null} */
    sante: null,

    /** Les vues que l'utilisateur courant peut interroger. */
    catalogue: null,

    /** Une question est en cours : le bouton et le champ sont verrouillés. */
    enCours: false,

    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** Le module est-il utilisable ? `null` tant que le diagnostic n'a pas tourné. */
    utilisable: (state) => state.sante?.disponible ?? null,

    /**
     * Pourquoi l'assistant est indisponible, en clair.
     *
     * Le backend distingue trois causes ; les confondre en « service
     * indisponible » obligerait l'utilisateur à ouvrir la console.
     */
    raisonIndisponible: (state) => {
      if (!state.sante || state.sante.disponible) return null;
      const modele = state.sante.modele || {};
      if (modele.erreur) return modele.erreur;
      if (!modele.joignable) return `Le fournisseur « ${modele.fournisseur} » est injoignable.`;
      if (!modele.modelePresent) return `Le modèle « ${modele.modele} » n'est pas installé.`;
      if (!state.sante.sources) return 'Les sources de données sont illisibles.';
      return 'Assistant indisponible.';
    },

    estVide: (state) => state.messages.length === 0,
  },

  actions: {
    /**
     * @template T
     * @param {() => Promise<T>} call
     * @param {{failure?: string, onSuccess?: (r: T) => void, silencieux?: boolean}} [options]
     */
    async run(call, { failure, onSuccess, silencieux = false } = {}) {
      const notifications = useNotificationStore();
      this.error = null;

      try {
        const result = await call();
        await onSuccess?.(result);
        return result;
      } catch (error) {
        this.error = error;
        if (!silencieux) notifications.notifyError(error, failure);
        return undefined;
      }
    },

    /** Diagnostic du module. Seul appel à lancer au montage de l'écran. */
    async fetchSante() {
      // Silencieux : une indisponibilité s'affiche dans l'écran, elle n'a pas à
      // faire surgir une notification d'erreur à chaque visite.
      return this.run(() => getSante(), {
        silencieux: true,
        onSuccess: (r) => {
          this.sante = r.data;
        },
      });
    },

    async fetchCatalogue() {
      return this.run(() => getCatalogue(), {
        failure: 'Erreur lors du chargement des sources accessibles.',
        onSuccess: (r) => {
          this.catalogue = r.data;
        },
      });
    },

    async fetchConversations() {
      return this.run(() => getConversations(), {
        silencieux: true,
        onSuccess: (r) => {
          this.conversations = r.data ?? [];
        },
      });
    },

    /**
     * Pose une question et l'ajoute au fil.
     *
     * La question est affichée **avant** l'appel : sur une réponse qui prend
     * plusieurs secondes, voir sa propre question s'inscrire est le seul signe
     * que la demande est partie.
     *
     * @param {string} question
     */
    async demander(question) {
      const texte = question.trim();
      if (!texte || this.enCours) return undefined;

      this.messages.push({ role: 'user', texte, horodatage: new Date().toISOString() });
      this.enCours = true;

      try {
        const reponse = await this.run(() => poserQuestion(texte, this.conversationId), {
          failure: "L'assistant n'a pas pu répondre.",
        });

        if (!reponse) {
          // L'échec est déjà notifié ; on l'inscrit aussi dans le fil, sans quoi
          // la question resterait seule, sans réponse ni explication.
          this.messages.push({
            role: 'assistant',
            texte: this.error?.message || "Je n'ai pas pu répondre à cette question.",
            aboutie: false,
            horodatage: new Date().toISOString(),
          });
          return undefined;
        }

        const d = reponse.data;
        this.conversationId = d.conversationId;
        this.messages.push({
          role: 'assistant',
          texte: d.reponse,
          requetes: d.requetes ?? [],
          aboutie: d.aboutie,
          dureeMs: d.dureeMs,
          horodatage: new Date().toISOString(),
        });

        // La liste latérale doit refléter le fil qui vient d'être ouvert.
        await this.fetchConversations();
        return d;
      } finally {
        this.enCours = false;
      }
    },

    /** Ouvre un fil neuf. Le précédent reste consultable côté serveur. */
    nouvelleConversation() {
      this.messages = [];
      this.conversationId = null;
      this.error = null;
    },
  },
});
