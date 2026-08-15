import { Marked } from 'marked';

/**
 * Rendu markdown des réponses de l'assistant.
 *
 * ## Pourquoi interpréter le markdown
 *
 * Les réponses arrivaient en texte brut, affichées en `white-space: pre-wrap`.
 * Tant que l'assistant répondait par une phrase, cela suffisait. Il répond
 * désormais par des tableaux — le prompt serveur l'y oblige dès trois lignes de
 * résultats (`assistant/prompt.js`, section « Mettre en forme ») — et un
 * tableau markdown non interprété est illisible :
 *
 * ```
 * | Filière | Étudiants |
 * | --- | ---: |
 * | Génie Civil | 125 |
 * ```
 *
 * ## Pourquoi ce n'est pas une injection HTML
 *
 * Une sortie de modèle n'est pas une source de confiance : elle contient ce que
 * le modèle a lu, donc des libellés venus de la base — un nom d'étudiant, une
 * intitulé de filière que quelqu'un a saisi. Interpréter cela comme du HTML
 * ferait de tout champ texte de l'ERP un vecteur de script stocké.
 *
 * Trois verrous, tous ci-dessous :
 *
 * 1. **Tout HTML brut est échappé** (`renderer.html`) : une balise dans la
 *    réponse s'affiche en clair, elle ne s'exécute pas. Le markdown, lui, reste
 *    interprété — c'est bien lui qu'on veut.
 * 2. **Les liens sont bornés à `http`, `https` et `mailto`** : un
 *    `[cliquez](javascript:…)` retombe en texte simple.
 * 3. **Les images sont refusées**, remplacées par leur texte alternatif. Une
 *    image distante dans une réponse n'a aucun usage légitime ici, et sa seule
 *    requête exfiltrerait la consultation vers un tiers.
 *
 * L'échappement se fait au rendu et non en amont : pré-échapper la source
 * casserait les blocs de code, où `<b>` doit s'afficher tel quel.
 */

/** Les seuls schémas d'URL qu'un lien de réponse peut porter. */
const SCHEMAS_AUTORISES = /^(https?:|mailto:)/i;

/**
 * Échappe ce qui, laissé tel quel, sortirait du texte pour devenir du balisage.
 *
 * Le `&` n'est pas réécrit quand il ouvre déjà une entité : sans cette garde,
 * `&amp;` deviendrait `&amp;amp;` et s'afficherait tel quel.
 *
 * @param {string} texte
 */
function echapper(texte) {
  return String(texte)
    .replace(/&(?!#?\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Instance dédiée plutôt que le singleton `marked`.
 *
 * `marked.use()` modifie l'état global du module : un autre écran qui
 * appellerait `marked()` hériterait de ces règles, et réciproquement — une
 * extension posée ailleurs désarmerait les verrous d'ici sans que rien ne le
 * signale.
 */
const moteur = new Marked({
  gfm: true,
  // Les modèles vont à la ligne sans laisser de ligne vide ; sans `breaks`,
  // ces retours disparaissent et deux constats se collent en un paragraphe.
  breaks: true,
});

moteur.use({
  renderer: {
    /** Verrou 1 : le HTML brut, bloc comme inline, n'est que du texte. */
    html(token) {
      return echapper(token.text);
    },

    /** Verrou 2 : un lien à schéma inattendu perd son ancre. */
    link({ href, title, tokens }) {
      const contenu = this.parser.parseInline(tokens);
      if (!SCHEMAS_AUTORISES.test(String(href).trim())) return contenu;

      const infobulle = title ? ` title="${echapper(title)}"` : '';
      // `noopener` : sans lui, la page ouverte garde une prise sur celle-ci.
      return `<a href="${echapper(href)}" target="_blank" rel="noopener noreferrer"${infobulle}>${contenu}</a>`;
    },

    /** Verrou 3 : pas d'image, seulement ce qu'elle prétendait montrer. */
    image({ text }) {
      return echapper(text || '');
    },
  },
});

/**
 * Habille les tableaux produits par marked.
 *
 * Un tableau de réponse tient dans une bulle de conversation : sans conteneur
 * défilant, une colonne de trop élargit la bulle, puis la colonne de page, puis
 * toute la mise en page. Les classes Bootstrap lui donnent par ailleurs
 * l'apparence des tableaux du reste de l'application.
 *
 * Passer par la chaîne rendue plutôt que par le `renderer.table` : marked ne
 * permet pas d'appeler le rendu par défaut depuis un remplaçant, et le
 * réécrire en entier pour ajouter deux classes se paierait à chaque montée de
 * version. Aucun `<table>` de la sortie ne vient d'ailleurs de la réponse — le
 * HTML brut est échappé avant.
 *
 * @param {string} html
 */
function habillerTableaux(html) {
  return html
    .replace(
      /<table>/g,
      '<div class="table-responsive"><table class="table table-sm table-bordered align-middle mb-0">'
    )
    .replace(/<\/table>/g, '</table></div>');
}

/**
 * Rend une réponse d'assistant en HTML sûr.
 *
 * @param {string} texte La réponse markdown du modèle.
 * @returns {string} HTML destiné à un `v-html`.
 */
export function rendreMarkdown(texte) {
  if (!texte) return '';
  return habillerTableaux(moteur.parse(String(texte)).trim());
}
