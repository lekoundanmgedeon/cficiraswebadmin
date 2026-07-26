import QRCode from 'qrcode';
import { formatMoney } from '../constants';

/**
 * Génération des codes QR de contrôle du domaine Finances.
 *
 * Le QR n'encode **pas** une URL vers un service de vérification : il porte
 * directement les faits du document (numéro, matricule, montant, date…), sous
 * une forme lisible par n'importe quel lecteur de téléphone, sans réseau ni
 * backend. Un agent de contrôle scanne le papier et compare ce que le QR affiche
 * à ce qui est imprimé : un reçu falsifié après impression trahit l'écart.
 *
 * Le format est un `clé:valeur` séparé par des barres verticales — compact,
 * stable, et directement intelligible à l'écran d'un smartphone.
 */

/** Correction d'erreur moyenne : ~15 % du code restaurable, bon compromis lisibilité/robustesse. */
const OPTIONS_DEFAUT = { errorCorrectionLevel: 'M', margin: 1, width: 128 };

/**
 * Rend un texte en QR, sous forme de data-URL PNG prête à poser dans un `<img>`.
 *
 * Asynchrone par nature (l'encodage passe par un canvas). En cas d'échec, on
 * renvoie `null` plutôt que de jeter : un document sans QR reste un document
 * valide, il ne faut pas qu'un souci d'encodage empêche l'impression.
 *
 * @param {string} texte
 * @param {import('qrcode').QRCodeToDataURLOptions} [options]
 * @returns {Promise<string|null>}
 */
export async function toQrDataUrl(texte, options = {}) {
  try {
    return await QRCode.toDataURL(String(texte ?? ''), { ...OPTIONS_DEFAUT, ...options });
  } catch {
    return null;
  }
}

/**
 * Assemble une charge utile `clé:valeur|clé:valeur`, en ignorant les champs
 * vides et en neutralisant le séparateur s'il apparaît dans une valeur.
 *
 * @param {Array<[string, string|number|null|undefined]>} paires
 */
function assemblerCharge(paires) {
  return paires
    .filter(([, valeur]) => valeur !== null && valeur !== undefined && valeur !== '')
    .map(([cle, valeur]) => `${cle}:${String(valeur).replace(/[|]/g, ' ')}`)
    .join('|');
}

/**
 * Charge utile du QR d'un reçu de paiement.
 *
 * @param {{
 *   numero_recu?: string, matricule?: string, etudiant?: string,
 *   montant?: number|string, date?: string, reference_transaction?: string,
 * }} recu
 */
export function chargeRecu(recu) {
  return assemblerCharge([
    ['RECU', recu.numero_recu],
    ['MAT', recu.matricule],
    ['ETU', recu.etudiant],
    ['MONTANT', montantBrut(recu.montant)],
    ['DATE', recu.date],
    ['REF', recu.reference_transaction],
  ]);
}

/**
 * Charge utile du QR de contrôle d'une situation de paiement (fiche étudiant).
 *
 * @param {{
 *   matricule?: string, etudiant?: string, classe?: string,
 *   du?: number, regle?: number, reste?: number, statut?: string, date?: string,
 * }} situation
 */
export function chargeSituation(situation) {
  return assemblerCharge([
    ['SITU', situation.matricule],
    ['ETU', situation.etudiant],
    ['CLASSE', situation.classe],
    ['DU', montantBrut(situation.du)],
    ['REGLE', montantBrut(situation.regle)],
    ['RESTE', montantBrut(situation.reste)],
    ['STATUT', situation.statut],
    ['LE', situation.date],
  ]);
}

/**
 * Montant en entier brut (sans séparateur ni devise) : c'est ce qu'un contrôle
 * automatisé ou un œil humain compare le plus sûrement. `formatMoney` reste pour
 * l'affichage, jamais pour le QR.
 *
 * @param {number|string|null|undefined} valeur
 */
function montantBrut(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '';
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? Math.round(nombre) : '';
}

// Ré-exporté pour les composants qui affichent le montant à côté du QR.
export { formatMoney };
