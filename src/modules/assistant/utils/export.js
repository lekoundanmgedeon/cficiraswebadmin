import { formatDateTime } from '@/shared/utils/date';

/**
 * Sauvegarde d'une conversation, en Markdown ou en CSV.
 *
 * ## Pourquoi pas `useTableExport`
 *
 * Le composable partagé rend trois formats, tous tabulaires : `json_to_sheet`
 * pour Excel, `jspdf-autotable` pour le PDF, des colonnes déduites des clés du
 * premier objet pour le CSV. Un fil de conversation n'a pas de colonnes — il a
 * un ordre, des rôles alternés et des réponses en Markdown qui contiennent
 * elles-mêmes des tableaux. Le passer dans `json_to_sheet` produirait une
 * colonne « reponse » de plusieurs milliers de caractères par cellule.
 *
 * Le CSV proposé ici n'est donc pas la conversation, mais son **relevé** : une
 * ligne par échange, pour qui veut compter ou recouper. Le Markdown, lui,
 * conserve la conversation telle qu'elle s'est tenue — tableaux compris,
 * puisque le modèle les produit déjà dans cette syntaxe.
 */

/**
 * Déclenche un téléchargement dans le navigateur.
 *
 * Même motif que `useTableExport.exportToCsv` : un `Blob`, une URL d'objet, un
 * lien cliqué puis révoqué. La révocation n'est pas décorative — sans elle, le
 * blob reste en mémoire jusqu'au rechargement de la page.
 *
 * @param {string} contenu
 * @param {string} nomFichier
 * @param {string} typeMime
 */
function telecharger(contenu, nomFichier, typeMime) {
  const blob = new Blob([contenu], { type: typeMime });
  const url = URL.createObjectURL(blob);

  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);

  URL.revokeObjectURL(url);
}

/**
 * Un nom de fichier tiré du titre du fil.
 *
 * Le titre est une question posée par l'utilisateur : elle contient des espaces,
 * des accents, souvent une apostrophe et un point d'interrogation — dont
 * plusieurs sont refusés par Windows dans un nom de fichier.
 *
 * @param {string} titre
 */
function nomFichier(titre, extension) {
  const base =
    String(titre ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .toLowerCase() || 'conversation';

  return `${base}-${Date.now()}.${extension}`;
}

/**
 * Le fil rendu en Markdown.
 *
 * L'en-tête porte la date de chaque échange, et ce n'est pas de la décoration :
 * une réponse d'assistant est un instantané des données. Sortie du fil sans sa
 * date, elle se lirait comme un chiffre encore valable — ce qu'aucune de ces
 * réponses n'est.
 *
 * Les requêtes SQL ne figurent dans l'export que si le serveur les a rendues,
 * c'est-à-dire pour un ADMIN : le filtrage a déjà eu lieu en amont, il n'est
 * pas refait ici.
 *
 * @param {{titre: string, cadrage: string|null, debut: string,
 *   echanges: Array<object>}} fil
 * @returns {string}
 */
export function filEnMarkdown(fil) {
  const lignes = [
    `# ${fil.titre}`,
    '',
    `> Conversation avec l'assistant IA — ${formatDateTime(fil.debut)}`,
    '>',
    '> Les chiffres cités sont ceux relevés au moment de chaque réponse.',
    '',
  ];

  for (const echange of fil.echanges) {
    lignes.push(`## ${echange.question}`, '', `*${formatDateTime(echange.horodatage)}*`, '');

    if (echange.reponse) {
      lignes.push(echange.reponse, '');
    } else {
      lignes.push(`> Sans réponse — ${echange.erreur || 'la question n’a pas abouti.'}`, '');
    }

    for (const requete of echange.requetes ?? []) {
      if (requete.intention) lignes.push(`<!-- ${requete.intention} -->`);
      lignes.push('```sql', requete.sql, '```', '');
    }
  }

  return lignes.join('\n');
}

/**
 * Le relevé du fil en CSV : une ligne par échange.
 *
 * Guillemets doublés et champ entouré, comme le veut la RFC 4180 — une réponse
 * contient des virgules, des retours à la ligne et des guillemets, les trois à
 * la fois.
 *
 * Le BOM en tête est ce qui évite qu'Excel lise « encaissÃ© » : sans lui, il
 * suppose la page de code du système plutôt qu'UTF-8.
 *
 * @param {{echanges: Array<object>}} fil
 * @returns {string}
 */
export function filEnCsv(fil) {
  const cellule = (valeur) => `"${String(valeur ?? '').replace(/"/g, '""')}"`;

  const lignes = [
    ['Horodatage', 'Question', 'Réponse', 'Aboutie', 'Durée (s)', 'Cadrage'].map(cellule).join(','),
  ];

  for (const echange of fil.echanges) {
    lignes.push(
      [
        formatDateTime(echange.horodatage),
        echange.question,
        echange.reponse || echange.erreur || '',
        echange.aboutie ? 'oui' : 'non',
        echange.dureeMs ? (echange.dureeMs / 1000).toFixed(1) : '',
        echange.cadrage || 'général',
      ]
        .map(cellule)
        .join(',')
    );
  }

  return `\uFEFF${lignes.join('\n')}`;
}

/** Sauvegarde le fil en `.md`. */
export function exporterMarkdown(fil) {
  telecharger(filEnMarkdown(fil), nomFichier(fil.titre, 'md'), 'text/markdown;charset=utf-8;');
}

/** Sauvegarde le relevé du fil en `.csv`. */
export function exporterCsv(fil) {
  telecharger(filEnCsv(fil), nomFichier(fil.titre, 'csv'), 'text/csv;charset=utf-8;');
}
