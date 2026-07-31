/**
 * Constantes du guichet des documents administratifs.
 *
 * La liste des **types** de documents n'est pas ici : elle vit en base
 * (`types_documents`) et se lit par `GET /documents/types`. Un établissement
 * ajoute un certificat sans qu'on livre une version.
 */

export const DEMANDE_MODAL_ID = 'demandeDocumentModal';

/**
 * Statuts d'une demande — `CHECK (statut IN ('SOUMISE','EN_TRAITEMENT','PRETE',
 * 'DELIVREE','REJETEE'))`.
 */
export const STATUTS_DEMANDE = {
  SOUMISE: { code: 'SOUMISE', label: 'Soumise', variant: 'secondary' },
  EN_TRAITEMENT: { code: 'EN_TRAITEMENT', label: 'En traitement', variant: 'primary' },
  PRETE: { code: 'PRETE', label: 'Prête', variant: 'info' },
  DELIVREE: { code: 'DELIVREE', label: 'Délivrée', variant: 'success' },
  REJETEE: { code: 'REJETEE', label: 'Rejetée', variant: 'danger' },
};

export const STATUT_DEMANDE_LIST = Object.values(STATUTS_DEMANDE);

/** @param {string} raw */
export const statutDemandeInfo = (raw) =>
  STATUTS_DEMANDE[String(raw ?? '').toUpperCase()] ?? {
    code: 'INCONNU',
    label: raw || '—',
    variant: 'secondary',
  };

/**
 * Transitions autorisées — **miroir** de la table `TRANSITIONS` du modèle
 * backend (`demande.model.js`).
 *
 * Ce miroir ne sert qu'à ne pas proposer un bouton qui répondrait 409 : la règle
 * qui fait foi est celle du serveur, qui la réapplique à chaque appel.
 */
const TRANSITIONS = {
  SOUMISE: ['EN_TRAITEMENT', 'PRETE', 'REJETEE'],
  EN_TRAITEMENT: ['PRETE', 'REJETEE'],
  PRETE: ['DELIVREE'],
  DELIVREE: [],
  REJETEE: [],
};

/**
 * Les gestes possibles depuis un statut donné.
 * @param {string} statut
 * @returns {Array<{code: string, label: string, variant: string}>}
 */
export function transitionsDepuis(statut) {
  const cible = TRANSITIONS[String(statut ?? '').toUpperCase()] ?? [];

  const libelles = {
    EN_TRAITEMENT: { label: 'Prendre en charge', variant: 'primary' },
    PRETE: { label: 'Marquer prête', variant: 'info' },
    DELIVREE: { label: 'Délivrer', variant: 'success' },
    REJETEE: { label: 'Rejeter', variant: 'danger' },
  };

  return cible.map((code) => ({ code, ...libelles[code] }));
}

/** Une demande est close quand elle est sortie du circuit. */
export const EST_CLOSE = ['DELIVREE', 'REJETEE'];

/** @param {string} statut */
export const estClose = (statut) => EST_CLOSE.includes(String(statut ?? '').toUpperCase());

/** `CHECK (nb_exemplaires > 0 AND nb_exemplaires <= 10)`. */
export const EXEMPLAIRES = { MIN: 1, MAX: 10 };
