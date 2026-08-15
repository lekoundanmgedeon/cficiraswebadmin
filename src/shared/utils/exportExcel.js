import * as XLSX from 'xlsx';

/**
 * Longueur maximale d'un nom d'onglet Excel. La limite vient du format, pas de
 * SheetJS : `book_append_sheet` lève « Sheet names cannot exceed 31 chars ».
 */
const LONGUEUR_MAX_ONGLET = 31;

/**
 * Rend un nom d'onglet acceptable par Excel.
 *
 * Les titres d'export sont des phrases lisibles — « Répartition des étudiants
 * par classe », « Calendrier officiel des épreuves — Session normale ». Passés
 * tels quels, ils **font échouer l'export** au-delà de 31 caractères, et
 * l'exception remontait jusqu'à l'utilisateur sous la forme d'un bouton qui ne
 * produit aucun fichier. Sept écrans étaient dans ce cas.
 *
 * Excel interdit par ailleurs `: \ / ? * [ ]` dans un nom d'onglet, et refuse
 * un nom vide. Le titre complet reste visible en tête du PDF et dans le nom du
 * fichier : seul l'onglet est abrégé.
 *
 * @param {string} nom
 * @returns {string}
 */
export const nomOngletValide = (nom) => {
  const nettoye = String(nom ?? '')
    .replace(/[:\\/?*[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!nettoye) return 'Feuille1';

  return nettoye.length > LONGUEUR_MAX_ONGLET
    ? nettoye.slice(0, LONGUEUR_MAX_ONGLET).trim()
    : nettoye;
};

/**
 * Génère un fichier Excel à partir de données JSON
 * @param {Object} options - Paramètres du fichier Excel
 * @param {Array} options.data - Tableau d'objets (JSON) représentant les lignes
 * @param {string} options.sheetName - Nom de l'onglet Excel, abrégé si besoin
 * @param {string} options.fileName - Nom du fichier Excel à sauvegarder
 */
export const exportExcel = ({
  data = [],
  sheetName = 'Feuille1',
  fileName = `export_${new Date().getTime()}.xlsx`,
}) => {
  // Créer une feuille à partir des données JSON
  const ws = XLSX.utils.json_to_sheet(data);

  // Créer un nouveau classeur
  const wb = XLSX.utils.book_new();

  // Ajouter la feuille au classeur
  XLSX.utils.book_append_sheet(wb, ws, nomOngletValide(sheetName));

  // Sauvegarder le fichier
  XLSX.writeFile(wb, fileName);
};
