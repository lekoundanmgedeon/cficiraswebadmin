import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import {
  getConversation,
  getConversations,
  getSante,
  patchConversation,
  poserQuestion,
} from '../api';

/**
 * Store de l'espace de chat.
 *
 * ## Un seul store, là où l'assistant embarqué en a un par cadrage
 *
 * `useAssistantStore(cadrage)` mémorise une instance par écran : quatre onglets
 * métier y tiennent quatre fils simultanés, chacun avec son `conversationId`.
 * L'espace, lui, n'affiche qu'une conversation à la fois — celle de l'URL. Un
 * store unique suffit, et deux instances y créeraient surtout le risque de voir
 * un fil en écraser un autre.
 *
 * ## Le fil est rechargé, et daté
 *
 * L'assistant embarqué gardait son fil en mémoire de session, sans le
 * recharger : rouvrir une conversation d'hier afficherait des chiffres périmés
 * (un effectif, un montant encaissé, un taux de recouvrement changent). Cette
 * prudence-là condamnait l'utilisateur à perdre tout ce qu'il avait demandé.
 *
 * L'espace tranche autrement : le fil est rechargé depuis
 * `GET /conversations/:id`, mais chaque message rejoué porte `archive: true` et
 * son horodatage serveur. L'écran affiche alors la date de la réponse et dit
 * que les chiffres sont ceux de ce moment-là. On restitue une trace, pas une
 * vérité encore valable.
 */
export const useEspaceChatStore = defineStore('assistant:espace', {
  state: () => ({
    /** @type {Array<{conversation_id: string, titre: string, nb_echanges: number,
     *   cadrages: string[], archivee: boolean, derniere_activite: string}>} */
    conversations: [],

    /** Filtres de la liste latérale — appliqués **côté serveur**. */
    recherche: '',
    filtreCadrage: null,
    archivees: false,

    /**
     * Le fil affiché.
     * @type {Array<{role: 'user'|'assistant', texte: string, requetes?: Array<object>,
     *   aboutie?: boolean, dureeMs?: number, horodatage: string, archive?: boolean}>}
     */
    messages: [],

    /** Fil serveur courant. `null` = la prochaine question en ouvrira un. */
    conversationId: null,

    /** Titre du fil courant, tel qu'affiché dans la barre. */
    titre: '',

    /** Le fil courant est-il rangé ? */
    archivee: false,

    /**
     * Le cadrage des prochaines questions.
     *
     * `null` — le cas par défaut — signifie « aucun écran » : l'espace n'est
     * l'écran d'aucun domaine. Il peut être choisi pour orienter la lecture du
     * modèle, jamais pour restreindre des droits : le cloisonnement reste le
     * catalogue filtré par rôle, côté serveur.
     */
    cadrage: null,

    /** @type {{disponible: boolean, modele: object, sources: object}|null} */
    sante: null,

    enCours: false,
    chargementListe: false,
    chargementFil: false,

    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** Le module est-il utilisable ? `null` tant que le diagnostic n'a pas tourné. */
    utilisable: (state) => state.sante?.disponible ?? null,

    /**
     * Pourquoi l'assistant est indisponible, en clair.
     *
     * Repris du store embarqué : le backend distingue trois causes, et les
     * confondre en « service indisponible » obligerait à ouvrir la console.
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

    /** Le fil affiché est-il une relecture, ou la conversation du moment ? */
    estRelecture: (state) => state.messages.some((m) => m.archive),

    /** Le fil complet, sous la forme qu'attendent les fonctions d'export. */
    filExportable: (state) => ({
      titre: state.titre || 'Conversation',
      cadrage: state.cadrage,
      debut: state.messages[0]?.horodatage ?? null,
      echanges: state.messages.reduce((echanges, message) => {
        if (message.role === 'user') {
          echanges.push({ question: message.texte, horodatage: message.horodatage });
          return echanges;
        }

        // Une réponse sans question qui la précède ne devrait pas exister ;
        // si elle survenait, l'ignorer vaut mieux que planter l'export.
        const dernier = echanges[echanges.length - 1];
        if (!dernier) return echanges;

        Object.assign(dernier, {
          reponse: message.texte,
          aboutie: message.aboutie ?? true,
          dureeMs: message.dureeMs ?? null,
          requetes: message.requetes ?? [],
          cadrage: state.cadrage,
        });
        return echanges;
      }, []),
    }),
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

    /** Diagnostic du module. Seul appel bon marché, lancé à l'ouverture. */
    async fetchSante() {
      return this.run(() => getSante(), {
        silencieux: true,
        onSuccess: (r) => {
          this.sante = r.data;
        },
      });
    },

    /** La liste latérale, avec les filtres courants. */
    async fetchConversations() {
      this.chargementListe = true;
      try {
        return await this.run(
          () =>
            getConversations({
              limite: 100,
              // Une chaîne vide n'est pas un filtre : envoyée telle quelle, le
              // serveur la neutralise, mais autant ne pas la transmettre.
              q: this.recherche.trim() || undefined,
              cadrage: this.filtreCadrage || undefined,
              archivees: this.archivees,
            }),
          {
            failure: 'Erreur lors du chargement des conversations.',
            onSuccess: (r) => {
              this.conversations = r.data ?? [];
            },
          }
        );
      } finally {
        this.chargementListe = false;
      }
    },

    /**
     * Rouvre une conversation.
     *
     * Chaque échange serveur devient **deux** messages — la question puis la
     * réponse —, parce que c'est ainsi que le fil s'affiche, alors que la base
     * les range sur une seule ligne.
     *
     * Tous portent `archive: true` : ce sont des chiffres arrêtés à leur date,
     * et l'écran doit le montrer.
     *
     * @param {string} id
     */
    async chargerConversation(id) {
      this.chargementFil = true;
      try {
        return await this.run(() => getConversation(id), {
          failure: "Cette conversation n'a pas pu être ouverte.",
          onSuccess: (r) => {
            const fil = r.data;
            this.conversationId = fil.conversationId;
            this.titre = fil.titre;
            this.archivee = fil.archivee;
            this.cadrage = fil.cadrage ?? null;

            this.messages = fil.echanges.flatMap((echange) => {
              const question = {
                role: 'user',
                texte: echange.question,
                horodatage: echange.horodatage,
                archive: true,
              };

              return [
                question,
                {
                  role: 'assistant',
                  // Un échange non abouti n'a pas de réponse : afficher son
                  // erreur vaut mieux qu'une bulle vide, qui laisserait croire
                  // à une perte d'affichage.
                  texte: echange.reponse || echange.erreur || "L'assistant n'a pas pu répondre.",
                  requetes: echange.requetes ?? [],
                  aboutie: echange.aboutie,
                  dureeMs: echange.dureeMs,
                  horodatage: echange.horodatage,
                  archive: true,
                },
              ];
            });
          },
        });
      } finally {
        this.chargementFil = false;
      }
    },

    /**
     * Ouvre un fil neuf. Le précédent reste consultable — il est en base.
     * @param {string|null} [cadrage]
     */
    nouvelleConversation(cadrage = null) {
      this.messages = [];
      this.conversationId = null;
      this.titre = '';
      this.archivee = false;
      this.cadrage = cadrage;
      this.error = null;
    },

    /**
     * Pose une question et l'ajoute au fil.
     *
     * La question s'affiche **avant** l'appel : une réponse prend plusieurs
     * secondes, et voir sa propre question s'inscrire est le seul signe que la
     * demande est partie.
     *
     * @param {string} question
     */
    async demander(question) {
      const texte = question.trim();
      if (!texte || this.enCours) return undefined;

      const nouveauFil = this.conversationId === null;

      this.messages.push({ role: 'user', texte, horodatage: new Date().toISOString() });
      this.enCours = true;

      try {
        const reponse = await this.run(
          () => poserQuestion(texte, this.conversationId, this.cadrage),
          { failure: "L'assistant n'a pas pu répondre." }
        );

        if (!reponse) {
          // L'échec est déjà notifié ; on l'inscrit aussi dans le fil, sans
          // quoi la question resterait seule, sans réponse ni explication.
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
        if (!this.titre) this.titre = texte;

        this.messages.push({
          role: 'assistant',
          texte: d.reponse,
          requetes: d.requetes ?? [],
          aboutie: d.aboutie,
          dureeMs: d.dureeMs,
          horodatage: new Date().toISOString(),
        });

        // La liste latérale n'est rafraîchie qu'à l'ouverture d'un fil : les
        // questions suivantes ne changent qu'un compteur, et un aller-retour
        // par réponse est un coût inutile sur un écran déjà lent.
        if (nouveauFil) await this.fetchConversations();

        return d;
      } finally {
        this.enCours = false;
      }
    },

    /**
     * Range ou sort du rangement une conversation.
     *
     * Il n'y a pas de suppression : le journal des échanges est aussi la trace
     * d'audit du module.
     *
     * @param {string} id
     * @param {boolean} valeur
     */
    async archiver(id, valeur) {
      const notifications = useNotificationStore();

      const resultat = await this.run(() => patchConversation(id, { archivee: valeur }), {
        failure: "La conversation n'a pas pu être rangée.",
      });
      if (resultat === undefined) return undefined;

      if (id === this.conversationId) this.archivee = valeur;
      notifications.notifySuccess(valeur ? 'Conversation archivée.' : 'Conversation restaurée.');

      await this.fetchConversations();
      return resultat;
    },

    /**
     * Renomme une conversation. `titre` à `null` rend le titre par défaut.
     * @param {string} id
     * @param {string|null} titre
     */
    async renommer(id, titre) {
      const resultat = await this.run(() => patchConversation(id, { titre }), {
        failure: "La conversation n'a pas pu être renommée.",
      });
      if (resultat === undefined) return undefined;

      await this.fetchConversations();

      // Le titre affiché se relit dans la liste plutôt que dans la réponse du
      // PATCH : celle-ci rend `titre: null` quand on annule un renommage, alors
      // que le fil retrouve pour titre sa première question — que seule la
      // liste calcule.
      if (id === this.conversationId) {
        const fil = this.conversations.find((c) => c.conversation_id === id);
        if (fil) this.titre = fil.titre;
      }

      return resultat;
    },
  },
});
