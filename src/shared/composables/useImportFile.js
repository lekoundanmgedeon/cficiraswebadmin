import { computed, ref } from 'vue';
import * as XLSX from 'xlsx';

/** Extensions acceptées par les imports par lot. */
export const IMPORT_ACCEPT = '.xlsx,.xls,.csv';

/**
 * Dépôt, prévisualisation et validation d'un fichier d'import.
 *
 * Vivait dans `modules/inscriptions` et n'était paramétrable que par un **nom**
 * de schéma (`'inscriptions' | 'reinscriptions'`), à choisir dans une table
 * interne à ce module. L'import de tuteurs, qui relève des étudiants, ne pouvait
 * donc pas s'en servir sans déclarer ses colonnes chez les inscriptions.
 *
 * Le composable reçoit désormais le **schéma lui-même** : chaque module garde
 * ses colonnes chez lui, et la mécanique — glisser-déposer, lecture SheetJS,
 * validation ligne à ligne, aperçu, gabarit — reste écrite une fois.
 *
 * @param {object} schema
 * @param {string[]} schema.columns Colonnes du gabarit, dans l'ordre.
 * @param {string[]} schema.required Colonnes dont la valeur est obligatoire.
 * @param {Record<string, any>} schema.example Ligne d'exemple du gabarit.
 * @param {string[]} [schema.booleans] Colonnes attendues en oui/non.
 * @param {string} [templateName] Suffixe du fichier modèle téléchargé.
 */
export function useImportFile(schema, templateName = 'import') {
  const selectedFile = ref(null);
  const isDragging = ref(false);
  const rows = ref([]);
  const errorMessage = ref('');

  const ACCEPTED_EXTENSIONS = IMPORT_ACCEPT.split(',');

  /** Valeurs que le backend interprète comme « vrai ». */
  const BOOLEENS_CONNUS = ['true', 'false', '1', '0', 'oui', 'non', 'yes', 'no', 'vrai', 'faux'];

  /** @param {File} file */
  function isAccepted(file) {
    // Validation sur l'extension, pas sur le type MIME : celui d'un .xlsx varie
    // d'un système à l'autre et vaut souvent `application/octet-stream`.
    const name = file.name.toLowerCase();
    return ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension));
  }

  /**
   * Valide une ligne du fichier.
   * @param {Record<string, any>} row
   * @returns {string[]} Les erreurs trouvées, vide si la ligne est bonne.
   */
  function validateRow(row) {
    const errors = [];

    for (const column of schema.required) {
      if (!String(row[column] ?? '').trim()) {
        errors.push(`${column} absent`);
      }
    }

    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email).trim())) {
      errors.push('format e-mail invalide');
    }

    if (row.sexe && !['M', 'F'].includes(String(row.sexe).toUpperCase().trim())) {
      errors.push('sexe invalide (M/F)');
    }

    for (const column of schema.booleans ?? []) {
      const valeur = String(row[column] ?? '')
        .toLowerCase()
        .trim();
      // Une valeur vide vaut « non » côté serveur : c'est un défaut, pas une
      // faute. Seule une valeur non interprétable est signalée — sans quoi elle
      // serait silencieusement ramenée à « non ».
      if (valeur && !BOOLEENS_CONNUS.includes(valeur)) {
        errors.push(`${column} : attendu oui/non`);
      }
    }

    return errors;
  }

  /** @param {File|undefined} file */
  function selectFile(file) {
    errorMessage.value = '';
    rows.value = [];

    if (!file) return;

    if (!isAccepted(file)) {
      errorMessage.value = `Format non pris en charge. Attendu : ${IMPORT_ACCEPT}.`;
      selectedFile.value = null;
      return;
    }

    selectedFile.value = file;

    const reader = new FileReader();

    reader.onerror = () => {
      errorMessage.value = 'Le fichier n’a pas pu être lu.';
      selectedFile.value = null;
    };

    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(new Uint8Array(event.target.result), {
          type: 'array',
          cellDates: true,
        });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (parsed.length === 0) {
          errorMessage.value = 'Le fichier ne contient aucune ligne.';
          selectedFile.value = null;
          return;
        }

        // Colonne absente de l'en-tête : le serveur refuserait tout le fichier.
        // Autant le dire avant de le téléverser. On ne contrôle que les colonnes
        // dont la valeur est obligatoire : le contrat de colonnes du serveur est
        // parfois plus large que ce qu'il exige réellement.
        const entetes = Object.keys(parsed[0]).map((entete) => entete.trim());
        const absentes = schema.required.filter((column) => !entetes.includes(column));

        if (absentes.length > 0) {
          errorMessage.value = `Colonne(s) manquante(s) : ${absentes.join(', ')}.`;
          selectedFile.value = null;
          return;
        }

        rows.value = parsed.map((row) => ({ ...row, _errors: validateRow(row) }));
      } catch {
        // L'ancienne version n'entourait pas la lecture SheetJS : un fichier
        // corrompu ou protégé par mot de passe levait une exception non
        // interceptée, et l'écran restait figé sans explication.
        errorMessage.value = 'Le fichier est illisible ou n’est pas un classeur valide.';
        selectedFile.value = null;
      }
    };

    reader.readAsArrayBuffer(file);
  }

  /** @param {DragEvent} event */
  function onDrop(event) {
    isDragging.value = false;
    selectFile(event.dataTransfer?.files?.[0]);
  }

  /** @param {Event} event */
  function onFileChange(event) {
    selectFile(event.target.files?.[0]);
  }

  const invalidRows = computed(() => rows.value.filter((row) => row._errors.length > 0));
  const hasErrors = computed(() => invalidRows.value.length > 0);
  const isReady = computed(() => Boolean(selectedFile.value) && !hasErrors.value);

  /** Les cinq premières lignes, pour l'aperçu. */
  const preview = computed(() => rows.value.slice(0, 5));

  function reset() {
    selectedFile.value = null;
    rows.value = [];
    errorMessage.value = '';
    isDragging.value = false;
  }

  /** Télécharge un classeur vide aux bonnes colonnes, avec une ligne d'exemple. */
  function downloadTemplate() {
    const worksheet = XLSX.utils.json_to_sheet([schema.example], { header: schema.columns });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modèle');
    XLSX.writeFile(workbook, `modele_${templateName}.xlsx`);
  }

  return {
    schema,
    selectedFile,
    isDragging,
    rows,
    preview,
    invalidRows,
    hasErrors,
    isReady,
    errorMessage,
    onDrop,
    onFileChange,
    selectFile,
    reset,
    downloadTemplate,
  };
}
