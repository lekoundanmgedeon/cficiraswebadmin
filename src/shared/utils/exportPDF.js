import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un PDF avec bannière, titre, infos et tableau
 * @param {Object} options - Paramètres du PDF
 * @param {string} options.logoBase64 - Image base64 du logo
 * @param {string} options.title - Titre du document
 * @param {Array} options.filters - Tableau d'objets { label, value }
 * @param {Array} options.columns - Colonnes du tableau
 * @param {Array} options.rows - Données du tableau
 * @param {string} options.fileName - Nom du fichier PDF
 */
export const exportPDF = ({
  logoBase64,
  title,
  filters = [],
  columns = [],
  rows = [],
  fileName = `document_${new Date().getTime()}.pdf`,
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // === BANNIÈRE SUPÉRIEURE ===
  doc.addImage(logoBase64, 'PNG', 0, 0, pageWidth, 50);

  // === TITRE DU DOCUMENT ===
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 60, { align: 'center' });

  // === INFORMATIONS DE FILTRAGE ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  let yPos = 68;
  filters.forEach(({ label, value }) => {
    doc.text(`${label}: ${value}`, 14, yPos);
    yPos += 5;
  });

  // === TABLEAU ===
  autoTable(doc, {
    startY: yPos + 5,
    head: [columns],
    body: rows,
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: yPos + 5, left: 14, right: 14 },
    didDrawPage: () => {
      const pageCount = doc.internal.pages.length - 1;
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber} / ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });

  // === SAUVEGARDE ===
  doc.save(fileName);
};
