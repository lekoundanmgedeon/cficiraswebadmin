/**
 * Constantes du module Scolarité (dossiers scolaires).
 *
 * Les énumérations ci-dessous ne sont pas devinées : elles sont **relevées sur
 * les contraintes `CHECK` de la base**, seule source qui fasse foi (aucun script
 * de migration n'est versionné dans le dépôt backend) :
 *
 * ```sql
 * -- table dossiers
 * CHECK (statut_dossier IN ('INCOMPLET','COMPLET','VERIFIE','REJETE'))
 * -- table pieces_dossier
 * CHECK (statut     IN ('EN_ATTENTE','VALIDE','REJETE'))
 * CHECK (type_piece IN ('DIPLOME','ATTESTATION_REUSSITE','ACTE_NAISSANCE','RELEVE_NOTES','AUTRE'))
 * CHECK (chemin ~ '^/uploads/.*\.(pdf|jpg|jpeg|png)$')
 * ```
 */

/** Identifiant DOM de la modale d'ajout d'une pièce. */
export const PIECE_MODAL_ID = 'ajoutPieceModal';

/** Statuts d'un dossier administratif. */
export const DOSSIER_STATUTS = {
  INCOMPLET: { code: 'INCOMPLET', label: 'Incomplet', variant: 'warning' },
  COMPLET: { code: 'COMPLET', label: 'Complet', variant: 'info' },
  VERIFIE: { code: 'VERIFIE', label: 'Vérifié', variant: 'success' },
  REJETE: { code: 'REJETE', label: 'Rejeté', variant: 'danger' },
};

export const DOSSIER_STATUT_LIST = Object.values(DOSSIER_STATUTS);

/** @param {string} raw @returns {{code: string, label: string, variant: string}} */
export function dossierInfo(raw) {
  const code = String(raw ?? '')
    .trim()
    .toUpperCase();
  return (
    DOSSIER_STATUTS[code] ?? {
      code: 'INCONNU',
      label: raw || 'Non renseigné',
      variant: 'secondary',
    }
  );
}

/** Statuts d'une pièce justificative. */
export const PIECE_STATUTS = {
  EN_ATTENTE: { code: 'EN_ATTENTE', label: 'En attente', variant: 'warning' },
  VALIDE: { code: 'VALIDE', label: 'Validée', variant: 'success' },
  REJETE: { code: 'REJETE', label: 'Rejetée', variant: 'danger' },
};

/** @param {string} raw @returns {{code: string, label: string, variant: string}} */
export function pieceInfo(raw) {
  const code = String(raw ?? '')
    .trim()
    .toUpperCase();
  return PIECE_STATUTS[code] ?? { code: 'INCONNU', label: raw || 'Inconnu', variant: 'secondary' };
}

/**
 * Décisions possibles sur une pièce.
 *
 * Le serveur n'accepte que `VALIDE` et `REJETE` (400 sinon), et **exige un
 * motif** en cas de rejet — c'est explicite dans `verifierPieceDossier` :
 * « Le motif de rejet est obligatoire pour corriger le dossier. »
 */
export const PIECE_DECISIONS = [
  { code: 'VALIDE', label: 'Valider la pièce', variant: 'success', motifRequis: false },
  { code: 'REJETE', label: 'Rejeter la pièce', variant: 'danger', motifRequis: true },
];

/** Types de pièce acceptés par la base. */
export const TYPES_PIECE = [
  { code: 'DIPLOME', label: 'Diplôme' },
  { code: 'ATTESTATION_REUSSITE', label: 'Attestation de réussite' },
  { code: 'ACTE_NAISSANCE', label: 'Acte de naissance' },
  { code: 'RELEVE_NOTES', label: 'Relevé de notes' },
  { code: 'AUTRE', label: 'Autre' },
];

/** @param {string} code @returns {string} */
export const typePieceLabel = (code) =>
  TYPES_PIECE.find((type) => type.code === code)?.label ?? code ?? '—';

/**
 * Forme attendue du chemin d'une pièce.
 *
 * La contrainte est portée par la base, pas par le contrôleur : un chemin mal
 * formé remonte donc en **erreur SQL brute** (« violates check constraint »),
 * illisible pour l'utilisateur. On valide côté client pour ne jamais en arriver là.
 */
export const CHEMIN_PATTERN = /^\/uploads\/.+\.(pdf|jpg|jpeg|png)$/i;

/** @param {string} chemin @returns {boolean} */
export const cheminValide = (chemin) => CHEMIN_PATTERN.test(String(chemin ?? '').trim());
