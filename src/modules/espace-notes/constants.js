/**
 * Constantes de l'espace de gestion des notes.
 *
 * Cet espace vit dans une fenêtre à part (voir `routes.js`) et tient sa propre
 * session. Il porte la chaîne complète : saisie → vérification → validation →
 * publication.
 */

/** Préfixe d'URL de l'espace. Sert aussi à décider la portée du jeton. */
export const ESPACE_NOTES_BASE = '/espace-notes';

/**
 * Rôles concernés, tels que la base les écrit.
 *
 * `CHECK (role IN ('ADMIN', 'SCOLARITE', 'PEDAGOGIE', 'C_CYCLE', 'FINANCES',
 * 'DIRECTEUR', 'ENSEIGNANT', 'GESTIONNAIRE'))` — on n'invente pas de rôle, on
 * se sert de ceux qui existent.
 */
export const ROLES = {
  ENSEIGNANT: { code: 'ENSEIGNANT', label: 'Enseignant', mission: 'Saisit et corrige les notes' },
  GESTIONNAIRE: {
    code: 'GESTIONNAIRE',
    label: 'Gestionnaire',
    mission: 'Vérifie la conformité des grilles',
  },
  SCOLARITE: { code: 'SCOLARITE', label: 'Scolarité', mission: 'Valide les notes vérifiées' },
  DIRECTEUR: { code: 'DIRECTEUR', label: 'Directeur', mission: 'Publie les notes validées' },
  ADMIN: { code: 'ADMIN', label: 'Administrateur', mission: 'Accès complet' },
};

/**
 * Capacités par rôle — **miroir** de la table `TRANSITIONS` du contrôleur
 * backend (`note.controller.js`).
 *
 * Ce miroir sert à ne pas afficher un bouton qui répondrait 403 : c'est du
 * confort d'interface, **pas une sécurité**. La règle qui fait foi est celle du
 * serveur, qui la réapplique à chaque appel — l'espace peut être ouvert par
 * n'importe qui à l'URL, le jeton décide.
 */
const CAPACITES_PAR_ROLE = {
  ENSEIGNANT: ['saisir'],
  GESTIONNAIRE: ['saisir', 'verifier', 'renvoyer'],
  SCOLARITE: ['saisir', 'verifier', 'valider', 'renvoyer', 'moyennes'],
  DIRECTEUR: ['verifier', 'publier', 'moyennes', 'publier_bulletins'],
  ADMIN: ['saisir', 'verifier', 'valider', 'renvoyer', 'publier', 'moyennes', 'publier_bulletins'],
};

/** Rôles autorisés à entrer dans l'espace. */
export const ROLES_AUTORISES = Object.keys(CAPACITES_PAR_ROLE);

/**
 * @param {string|null|undefined} role
 * @param {'saisir'|'verifier'|'valider'|'renvoyer'|'publier'|'moyennes'|'publier_bulletins'} capacite
 */
export function peut(role, capacite) {
  const code = String(role ?? '')
    .trim()
    .toUpperCase();
  return (CAPACITES_PAR_ROLE[code] ?? []).includes(capacite);
}

/** @param {string|null|undefined} role */
export function capacitesDe(role) {
  const code = String(role ?? '')
    .trim()
    .toUpperCase();
  return CAPACITES_PAR_ROLE[code] ?? [];
}

/** @param {string|null|undefined} role */
export function roleInfo(role) {
  const code = String(role ?? '')
    .trim()
    .toUpperCase();
  return ROLES[code] ?? { code: code || 'INCONNU', label: role || 'Rôle inconnu', mission: '—' };
}

/**
 * Les quatre étapes du traitement d'une grille.
 *
 * ⚠️ **Trois statuts en base, quatre étapes à l'écran.** La colonne `statut`
 * n'accepte que `SAISIE`, `VALIDEE` et `PUBLIEE` : la **vérification n'est pas
 * un état serveur**. C'est un contrôle recalculé à chaque affichage
 * (complétude, bornes, doublons) — il n'est pas stocké, et rouvrir la grille le
 * rejoue. On ne prétend donc pas qu'une grille « a été vérifiée » : on montre
 * si elle *est* conforme, ce qui est vérifiable à tout instant.
 */
export const ETAPES = [
  {
    id: 'saisie',
    label: 'Saisie',
    statut: 'SAISIE',
    capacite: 'saisir',
    role: 'ENSEIGNANT',
    description: 'L’enseignant saisit les notes de son évaluation.',
  },
  {
    id: 'verification',
    label: 'Vérification',
    statut: null,
    capacite: 'verifier',
    role: 'GESTIONNAIRE',
    description: 'Le gestionnaire contrôle la conformité de la grille avant transmission.',
  },
  {
    id: 'validation',
    label: 'Validation',
    statut: 'VALIDEE',
    capacite: 'valider',
    role: 'SCOLARITE',
    description: 'La scolarité valide la grille : les notes deviennent officielles.',
  },
  {
    id: 'publication',
    label: 'Publication',
    statut: 'PUBLIEE',
    capacite: 'publier',
    role: 'DIRECTEUR',
    description: 'Le directeur publie les notes validées.',
  },
];

/** Statuts que l'application principale a le droit d'afficher. */
export const STATUTS_PUBLIABLES = ['VALIDEE', 'PUBLIEE'];

/** Caractéristiques de la fenêtre ouverte par le bouton d'accès. */
export const FENETRE = {
  nom: 'espace-notes',
  options: 'popup=yes,width=1440,height=920,menubar=no,toolbar=no,location=no,status=no',
};

/**
 * Ouvre l'espace dans une fenêtre minimale.
 *
 * `window.open` peut renvoyer `null` — bloqueur de fenêtres, ou navigateur qui
 * refuse l'ouverture hors geste utilisateur. L'appelant doit le dire plutôt que
 * de laisser croire que la fenêtre s'est ouverte.
 *
 * @param {string} [chemin] Route interne à ouvrir.
 * @returns {Window|null}
 */
export function ouvrirEspaceNotes(chemin = ESPACE_NOTES_BASE) {
  return window.open(chemin, FENETRE.nom, FENETRE.options);
}
