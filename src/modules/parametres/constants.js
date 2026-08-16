/**
 * Repères de l'écran Paramètres.
 *
 * ## Les huit rôles, et pourquoi ils ne sont pas repris d'`espace-notes`
 *
 * `modules/espace-notes/constants.js` définit déjà un tableau `ROLES` — mais
 * **cinq rôles seulement**, ceux qui interviennent dans le circuit de validation
 * des notes. La gestion des comptes en couvre huit : la contrainte
 * `users_role_check` du schéma, que le backend reproduit dans
 * `ROLES_AUTORISES` (`auth.controller.js`).
 *
 * Reprendre la liste partielle laisserait trois rôles sans libellé — et, pire,
 * absents du menu de création d'un compte. Le miroir est donc complet ici, et sa
 * source est la contrainte du schéma.
 */

/** Miroir de `users_role_check` et de `ROLES_AUTORISES` côté serveur. */
export const ROLES = {
  ADMIN: {
    libelle: 'Administrateur',
    mission: 'Accès complet, y compris aux paramètres et aux comptes',
    couleur: 'danger',
  },
  DIRECTEUR: {
    libelle: 'Directeur',
    mission: 'Publie les notes validées, consulte les bilans',
    couleur: 'primary',
  },
  SCOLARITE: {
    libelle: 'Scolarité',
    mission: 'Dossiers, inscriptions, validation des notes',
    couleur: 'info',
  },
  PEDAGOGIE: {
    libelle: 'Pédagogie',
    mission: 'Enseignants, attributions, emplois du temps',
    couleur: 'success',
  },
  C_CYCLE: {
    libelle: 'Coordination de cycle',
    mission: 'Suivi pédagogique d’un cycle',
    couleur: 'success',
  },
  FINANCES: {
    libelle: 'Finances',
    mission: 'Encaissements, factures, recouvrement',
    couleur: 'warning',
  },
  ENSEIGNANT: {
    libelle: 'Enseignant',
    mission: 'Saisit et corrige les notes de ses cours',
    couleur: 'secondary',
  },
  GESTIONNAIRE: {
    libelle: 'Gestionnaire',
    mission: 'Vérifie la conformité des grilles, gère les imports',
    couleur: 'secondary',
  },
};

/** Les codes acceptés, dans l'ordre d'affichage des menus. */
export const ROLES_CONNUS = Object.keys(ROLES);

/** L'étiquette d'un rôle, y compris pour un code que le front ignore. */
export function roleInfo(code) {
  return ROLES[code] || { libelle: code || 'Rôle inconnu', mission: '—', couleur: 'secondary' };
}

/**
 * Les catégories de réglages, et comment les présenter.
 *
 * Les clés viennent du serveur (colonne `categorie` de `parametres_plateforme`).
 * Cette table ne fait que les habiller : une catégorie ajoutée en base
 * s'affichera avec son propre nom plutôt que de disparaître.
 */
export const CATEGORIES = {
  etablissement: {
    libelle: 'Établissement',
    icone: 'bi-building',
    description: 'Repris en en-tête de tous les documents et exports PDF.',
  },
  finances: {
    libelle: 'Finances',
    icone: 'bi-cash-stack',
    description: 'Devise appliquée à tous les montants affichés.',
  },
  scolarite: {
    libelle: 'Scolarité',
    icone: 'bi-mortarboard',
    description: 'Seuils et volumes de la maquette académique.',
  },
  notifications: {
    libelle: 'Notifications',
    icone: 'bi-bell',
    description: 'Conservation des messages adressés aux étudiants.',
  },
};

/** @param {string} cle */
export function categorieInfo(cle) {
  return CATEGORIES[cle] || { libelle: cle, icone: 'bi-sliders', description: '' };
}

/** Longueur minimale d'un mot de passe — miroir du contrôle serveur. */
export const LONGUEUR_MIN_MOT_DE_PASSE = 8;
