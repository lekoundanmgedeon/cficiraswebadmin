import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { getCatalogue, getSante, poserQuestion } from './api';

/**
 * Store de l'assistant **embarqué** — une instance par écran.
 *
 * ## Le fil est local, pas rechargé — ici
 *
 * Le fil affiché est celui de la session courante : ce store ne rouvre aucune
 * conversation passée. Ce n'est plus une limite du backend — `GET
 * /conversations/:id` rend désormais un fil entier —, c'est le partage des
 * rôles entre les deux assistants :
 *
 *  - **embarqué** (cet écran-ci et les quatre onglets métier) : la question
 *    rapide sur la vue qu'on a sous les yeux, sans mémoire ;
 *  - **espace de chat** (`espace/store.js`) : la conversation suivie, la
 *    relecture de tout l'historique, la sauvegarde et l'audit.
 *
 * La prudence d'origine y a été conservée sans son inconvénient : l'espace
 * recharge les fils, mais chaque message rejoué porte sa date — un effectif, un
 * montant encaissé, un taux de recouvrement changent, et l'écran le dit.
 *
 * ## Pourquoi un store par cadrage
 *
 * L'assistant vit désormais dans quatre onglets — structure académique,
 * délibération, rapports d'examens, rapports financiers — en plus de son écran
 * de plateforme. Un store unique leur ferait partager un seul fil : une
 * question sur les impayés apparaîtrait dans l'onglet des semestres, et surtout
 * les deux conversations n'en feraient qu'une côté serveur, chacune héritant du
 * contexte de l'autre.
 *
 * Chaque cadrage a donc son store, son fil et son `conversationId`. Les
 * définitions sont mémorisées : `defineStore` appelé deux fois avec le même
 * identifiant rendrait deux fonctions pour un seul état — de quoi croire à deux
 * fils là où il n'y en a qu'un.
 */

/** @type {Map<string, ReturnType<typeof definirStore>>} */
const stores = new Map();

/**
 * Le store de l'assistant pour un écran donné.
 *
 * @param {string|null} [cadrage] `structure-academique` | `scolarite` |
 *   `examens` | `finances`. Absent : l'écran général de la plateforme.
 */
export function useAssistantStore(cadrage = null) {
  const cle = cadrage || 'general';
  if (!stores.has(cle)) stores.set(cle, definirStore(cle, cadrage || null));
  return stores.get(cle)();
}

/**
 * @param {string} cle Identifiant du store, sans préfixe.
 * @param {string|null} cadrage Transmis tel quel au serveur à chaque question.
 */
function definirStore(cle, cadrage) {
  return defineStore(`assistant:${cle}`, {
    state: () => ({
      /** L'écran d'où partent les questions de ce fil. */
      cadrage,

      /**
       * Le fil courant.
       * @type {Array<{role: 'user'|'assistant', texte: string, requetes?: Array<object>,
       *   aboutie?: boolean, dureeMs?: number, horodatage: string}>}
       */
      messages: [],

      /** Fil serveur en cours. `null` = la prochaine question en ouvrira un. */
      conversationId: null,

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
          const reponse = await this.run(
            () => poserQuestion(texte, this.conversationId, this.cadrage),
            { failure: "L'assistant n'a pas pu répondre." }
          );

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

          return d;
        } finally {
          this.enCours = false;
        }
      },

      /**
       * Ouvre un fil neuf.
       *
       * Le précédent n'est pas perdu : il est en base, et l'espace de chat le
       * rouvrira — c'est même le seul endroit qui sache le faire.
       */
      nouvelleConversation() {
        this.messages = [];
        this.conversationId = null;
        this.error = null;
      },
    },
  });
}
