/**
 * Repères partagés de l'assistant : l'espace de chat et les cadrages.
 *
 * Le module vit désormais à deux endroits, et le partage est délibéré :
 *
 *  - **l'assistant embarqué** — l'écran `/assistant-ai` et les quatre onglets
 *    métier — sert les questions rapides et les constats sur la vue affichée ;
 *  - **l'espace de chat** (`/espace-chat`, onglet distinct) sert la conversation
 *    longue, la relecture de tout l'historique et l'audit.
 */

/**
 * Préfixe d'URL de l'espace de chat.
 *
 * ⚠️ Contrairement à `ESPACE_NOTES_BASE`, ce préfixe **ne déclenche aucune
 * portée de jeton** : l'espace de chat partage la session de l'application.
 * C'est ce qui permet d'y retrouver ses propres conversations sans se
 * reconnecter, et pourquoi `main.js` et `tokenStorage.js` l'ignorent.
 */
export const ESPACE_CHAT_BASE = '/espace-chat';

/**
 * Les cadrages acceptés par le serveur, et comment les nommer à l'écran.
 *
 * Miroir de `CADRAGES` dans `cfibackend/src/assistant/prompt.js` : le serveur
 * refuse en 400 toute clé absente de sa propre table — ce n'est pas du texte
 * libre. Une clé ajoutée ici sans l'être là-bas casserait l'envoi.
 *
 * `null` (« Général ») n'est pas un cadrage : c'est l'absence de cadrage, la
 * valeur que l'espace de chat envoie par défaut puisqu'il n'est l'écran
 * d'aucun domaine.
 */
export const CADRAGES = {
  'structure-academique': {
    libelle: 'Structure académique',
    icone: 'bi-diagram-3',
    couleur: 'primary',
  },
  scolarite: { libelle: 'Scolarité', icone: 'bi-mortarboard', couleur: 'info' },
  examens: { libelle: 'Examens', icone: 'bi-clipboard-data', couleur: 'success' },
  finances: { libelle: 'Finances', icone: 'bi-cash-stack', couleur: 'warning' },
};

/** Les clés acceptées, dans l'ordre d'affichage des filtres. */
export const CADRAGES_CONNUS = Object.keys(CADRAGES);

/** L'étiquette d'un cadrage, y compris pour `null` et pour une clé inconnue. */
export function cadrageInfo(cle) {
  return (
    CADRAGES[cle] || {
      libelle: 'Général',
      icone: 'bi-chat-dots',
      couleur: 'secondary',
    }
  );
}

/**
 * Ouvre l'espace de chat dans un **onglet**.
 *
 * Divergence assumée avec `ouvrirEspaceNotes`, qui ouvre une popup dimensionnée
 * sans barre d'outils : l'espace de notes est un outil de saisie qu'on ferme
 * après usage, l'espace de chat est un lieu où l'on revient et dont on veut
 * pouvoir garder l'URL, l'historique et les favoris du navigateur.
 *
 * Rend `null` quand le navigateur bloque l'ouverture — l'appelant doit le dire,
 * sans quoi l'utilisateur reste devant un bouton qui « ne fait rien ».
 *
 * @param {string} [chemin]
 * @returns {Window|null}
 */
export function ouvrirEspaceChat(chemin = ESPACE_CHAT_BASE) {
  return window.open(chemin, '_blank');
}

/** L'URL d'une conversation dans l'espace. */
export function cheminConversation(conversationId) {
  return `${ESPACE_CHAT_BASE}/c/${conversationId}`;
}
