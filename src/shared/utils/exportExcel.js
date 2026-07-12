import * as XLSX from 'xlsx';

/**
 * Génère un fichier Excel à partir de données JSON
 * @param {Object} options - Paramètres du fichier Excel
 * @param {Array} options.data - Tableau d'objets (JSON) représentant les lignes
 * @param {string} options.sheetName - Nom de l'onglet Excel
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
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Sauvegarder le fichier
  XLSX.writeFile(wb, fileName);
};
