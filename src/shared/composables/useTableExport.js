import { unref } from 'vue';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { exportExcel } from '@/shared/utils/exportExcel';
import { exportPDF } from '@/shared/utils/exportPDF';
import logoCFI from '@/assets/logoBase64';

/**
 * Export d'un tableau en Excel ou en PDF.
 *
 * Onze composants répétaient la même triade : un `getExportData()` construisant
 * des lignes, un `exportXxxExcel()` et un `exportXxxPDF()` qui redéclaraient la
 * liste des colonnes — souvent désynchronisée de celle des lignes, puisque les
 * deux étaient maintenues à la main.
 *
 * Ici, les colonnes sont **dérivées des lignes** : elles ne peuvent plus diverger.
 * Chaque appelant ne fournit que la projection métier de ses données.
 *
 * @param {object} options
 * @param {() => Array<Record<string, any>>} options.rows
 *   Renvoie les lignes à exporter, sous forme d'objets `{ 'Nom de colonne': valeur }`.
 *   L'ordre des clés du premier objet définit l'ordre des colonnes.
 * @param {string} options.title Titre affiché en tête du PDF.
 * @param {string} options.fileBaseName Base du nom de fichier, sans extension ni horodatage.
 * @param {() => Array<{label: string, value: any}>} [options.filters]
 *   Métadonnées affichées sous le titre du PDF (période, effectifs…).
 * @param {string} [options.sheetName] Nom de l'onglet Excel. Par défaut, le titre.
 */
export function useTableExport({ rows, title, fileBaseName, filters, sheetName }) {
  const notifications = useNotificationStore();

  /** @returns {Array<Record<string, any>>|null} `null` s'il n'y a rien à exporter. */
  function resolveRows() {
    const data = unref(rows) ?? [];
    if (data.length === 0) {
      notifications.notifyWarning("Aucune donnée disponible pour l'export.");
      return null;
    }
    return data;
  }

  /** @param {string} extension */
  const fileName = (extension) => `${fileBaseName}_${Date.now()}.${extension}`;

  function exportToExcel() {
    const data = resolveRows();
    if (!data) return;

    exportExcel({
      data,
      sheetName: sheetName ?? title,
      fileName: fileName('xlsx'),
    });
  }

  function exportToPdf() {
    const data = resolveRows();
    if (!data) return;

    // Les colonnes sont déduites des lignes : impossible qu'elles se désynchronisent.
    const columns = Object.keys(data[0]);

    exportPDF({
      logoBase64: logoCFI,
      title,
      filters: filters?.() ?? [
        { label: 'Total', value: data.length },
        { label: "Date d'export", value: new Date().toLocaleDateString('fr-FR') },
      ],
      columns,
      rows: data.map((row) => columns.map((column) => row[column])),
      fileName: fileName('pdf'),
    });
  }

  /**
   * Échappe une cellule au format CSV (RFC 4180) : les guillemets internes sont
   * doublés, et la valeur est toujours encadrée, ce qui neutralise d'un coup les
   * virgules, les points-virgules et les retours à la ligne qu'elle contiendrait.
   * @param {any} value
   */
  function escapeCsvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function exportToCsv() {
    const data = resolveRows();
    if (!data) return;

    const columns = Object.keys(data[0]);
    const lines = [
      columns.map(escapeCsvCell).join(','),
      ...data.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(',')),
    ];

    // Le BOM force Excel à lire le fichier en UTF-8 ; sans lui, les accents des
    // en-têtes (« Prénom », « Filière ») ressortent en mojibake.
    const blob = new Blob(['﻿', lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName('csv');
    link.click();
    URL.revokeObjectURL(url);
  }

  return { exportToExcel, exportToPdf, exportToCsv };
}
