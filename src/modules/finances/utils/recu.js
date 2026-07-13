import { formatMoney } from '../constants';

/**
 * Ouvre la fenêtre d'impression d'un reçu de caisse.
 *
 * Le bouton « Imprimer le reçu » des écrans se contentait d'un `alert()`
 * (« Format A5 standardisé prêt. ») : rien n'était imprimé. Le reçu, lui, existe
 * bel et bien — le serveur l'émet à chaque encaissement, dans la même
 * transaction que le paiement — et `GET /paiements/:id/recu` le sert.
 *
 * L'impression passe par une fenêtre dédiée plutôt que par un composant : cela
 * évite d'ajouter du balisage aux écrans, et le navigateur gère seul la mise en
 * page A5.
 *
 * @param {{
 *   numero_recu: string, etudiant: string, matricule: string,
 *   montant: number|string, mode: string, type: string, date: string,
 *   reference_transaction?: string, classe?: string, filiere?: string,
 *   numero_facture?: string|null,
 * }} recu
 */
export function imprimerRecu(recu) {
  const fenetre = window.open('', '_blank', 'width=600,height=800');

  // Bloqueur de pop-ups, ou navigateur qui refuse : on le dit plutôt que
  // d'échouer en silence.
  if (!fenetre) {
    throw new Error(
      'La fenêtre d’impression a été bloquée. Autorisez les pop-ups pour imprimer le reçu.'
    );
  }

  const ligne = (label, valeur) =>
    valeur ? `<tr><th>${label}</th><td>${escapeHtml(String(valeur))}</td></tr>` : '';

  fenetre.document.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Reçu ${escapeHtml(recu.numero_recu ?? '')}</title>
        <style>
          @page { size: A5; margin: 12mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #212529; font-size: 12px; }
          h1 { font-size: 16px; margin: 0 0 2px; }
          .sous-titre { color: #6c757d; font-size: 11px; margin: 0 0 16px; }
          .numero { font-family: monospace; font-size: 14px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid #e9ecef; }
          th { color: #6c757d; font-weight: 600; width: 42%; }
          .montant { font-size: 18px; font-weight: bold; }
          footer { margin-top: 24px; color: #6c757d; font-size: 10px; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Reçu de paiement</h1>
        <p class="sous-titre">
          N° <span class="numero">${escapeHtml(recu.numero_recu ?? '')}</span>
        </p>

        <table>
          ${ligne('Étudiant', recu.etudiant)}
          ${ligne('Matricule', recu.matricule)}
          ${ligne('Classe', recu.classe)}
          ${ligne('Filière', recu.filiere)}
          ${ligne('Nature', recu.type)}
          ${ligne('Mode de paiement', recu.mode)}
          ${ligne('Date', recu.date)}
          ${ligne('Référence', recu.reference_transaction)}
          ${ligne('Facture', recu.numero_facture)}
          <tr>
            <th>Montant réglé</th>
            <td class="montant">${escapeHtml(formatMoney(recu.montant))}</td>
          </tr>
        </table>

        <footer>Document généré le ${new Date().toLocaleString('fr-FR')}</footer>
      </body>
    </html>
  `);

  fenetre.document.close();
  fenetre.focus();
  fenetre.print();
}

/**
 * Ouvre le document d'une facture : son en-tête, ses lignes et les paiements
 * déjà imputés.
 *
 * Le bouton « Télécharger PDF » de l'écran ne téléchargeait rien (`alert()`), et
 * il n'existe pas d'endpoint de génération de PDF côté serveur — `GET
 * /factures/:id` sert les données, pas le document. On le compose donc ici, et
 * l'impression du navigateur permet de l'enregistrer en PDF.
 *
 * @param {any} facture Facture détaillée (`GET /finance/factures/:id`).
 * @param {{imprimer?: boolean}} [options]
 */
export function ouvrirFacture(facture, { imprimer = false } = {}) {
  const fenetre = window.open('', '_blank', 'width=800,height=900');

  if (!fenetre) {
    throw new Error(
      'La fenêtre a été bloquée. Autorisez les pop-ups pour consulter ou imprimer la facture.'
    );
  }

  const lignes = (facture.lignes ?? [])
    .map(
      (ligne) => `
        <tr>
          <td>${escapeHtml(ligne.libelle ?? '')}</td>
          <td class="droite">${escapeHtml(formatMoney(ligne.montant))}</td>
        </tr>`
    )
    .join('');

  const paiements = (facture.paiements ?? [])
    .map(
      (paiement) => `
        <tr>
          <td>${escapeHtml(paiement.date ?? '')}</td>
          <td>${escapeHtml(paiement.mode ?? '')}</td>
          <td>${escapeHtml(paiement.numero_recu ?? '—')}</td>
          <td class="droite">${escapeHtml(formatMoney(paiement.montant))}</td>
        </tr>`
    )
    .join('');

  fenetre.document.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Facture ${escapeHtml(facture.numero ?? '')}</title>
        <style>
          @page { size: A4; margin: 16mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #212529; font-size: 12px; }
          h1 { font-size: 18px; margin: 0 0 2px; }
          h2 { font-size: 13px; margin: 20px 0 6px; color: #495057; }
          .sous-titre { color: #6c757d; font-size: 11px; margin: 0 0 18px; }
          .numero { font-family: monospace; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid #e9ecef; }
          thead th { color: #6c757d; font-size: 11px; text-transform: uppercase; }
          .droite { text-align: right; }
          .totaux td { border: none; padding: 3px 4px; }
          .totaux .valeur { text-align: right; font-weight: bold; }
          .solde { font-size: 15px; }
          footer { margin-top: 24px; color: #6c757d; font-size: 10px; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Facture <span class="numero">${escapeHtml(facture.numero ?? '')}</span></h1>
        <p class="sous-titre">
          ${escapeHtml(facture.etudiant ?? '')} — ${escapeHtml(facture.matricule ?? '')}
          · ${escapeHtml(facture.classe_code ?? '')} ${escapeHtml(facture.filiere ?? '')}
          · émise le ${escapeHtml(String(facture.date_emission ?? '').slice(0, 10))}
        </p>

        <h2>Détail</h2>
        <table>
          <thead><tr><th>Libellé</th><th class="droite">Montant</th></tr></thead>
          <tbody>${lignes || '<tr><td colspan="2">Aucune ligne.</td></tr>'}</tbody>
        </table>

        <h2>Règlements</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Mode</th><th>Reçu</th><th class="droite">Montant</th></tr>
          </thead>
          <tbody>${paiements || '<tr><td colspan="4">Aucun règlement.</td></tr>'}</tbody>
        </table>

        <table class="totaux">
          <tr><td>Total dû</td><td class="valeur">${escapeHtml(formatMoney(facture.total_du))}</td></tr>
          <tr><td>Déjà réglé</td><td class="valeur">${escapeHtml(formatMoney(facture.deja_paye))}</td></tr>
          <tr class="solde">
            <td>Solde restant</td>
            <td class="valeur">${escapeHtml(formatMoney(facture.solde))}</td>
          </tr>
        </table>

        <footer>Document généré le ${new Date().toLocaleString('fr-FR')}</footer>
      </body>
    </html>
  `);

  fenetre.document.close();
  fenetre.focus();
  if (imprimer) fenetre.print();
}

/**
 * Les documents sont composés par concaténation de chaînes : un nom d'étudiant
 * contenant `<` ou `&` casserait le document, voire y injecterait du balisage.
 *
 * @param {string} valeur
 */
function escapeHtml(valeur) {
  return valeur
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
