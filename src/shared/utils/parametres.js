import { nombre } from './remplissage';

/**
 * Les réglages de la plateforme, lisibles **hors composant**.
 *
 * ## Pourquoi ce fichier existe, plutôt qu'un simple store
 *
 * La règle de dépendance du dépôt est `modules → shared → core` : un utilitaire
 * partagé ne peut pas importer `modules/parametres/store.js`. Or c'est
 * précisément `shared` qui a besoin des réglages — `exportPDF.js` pour l'en-tête
 * des documents, le formatage des montants pour la devise.
 *
 * D'où l'inversion : ce module détient les valeurs, le store les y **dépose**
 * après les avoir chargées (`appliquerParametres`). La flèche reste dans le bon
 * sens, et aucun cycle d'import ne se forme.
 *
 * ## Pourquoi des valeurs de repli
 *
 * Un montant ne peut pas attendre une requête : il s'affiche au premier rendu,
 * parfois avant que `GET /parametres` soit revenu. Les replis ci-dessous sont
 * ceux que la migration 019 sème — l'affichage est donc juste dès la première
 * frame, et se corrige tout seul si l'établissement a changé ses réglages.
 */

/** Les valeurs par défaut, alignées sur le semis de la migration 019. */
const REPLIS = {
  'etablissement.nom': "Centre de Formation et d'Insertion",
  'etablissement.sigle': 'CFI',
  'finances.devise': 'XAF',
  'finances.devise_symbole': 'FCFA',
  'scolarite.moyenne_validation': '10',
  'scolarite.credits_annuels': '60',
};

/** @type {Record<string, string|null>} */
let valeurs = { ...REPLIS };

/**
 * Dépose les réglages chargés depuis le serveur.
 *
 * Les clés absentes de la réponse gardent leur repli : un serveur qui ne
 * connaîtrait pas encore une clé ne doit pas faire disparaître le symbole de la
 * devise de tous les écrans.
 *
 * @param {Record<string, string|null>} nouvelles
 */
export function appliquerParametres(nouvelles) {
  valeurs = { ...REPLIS, ...(nouvelles ?? {}) };
}

/**
 * La valeur d'un réglage, en texte.
 * @param {string} cle
 * @param {string} [defaut] Rendu si la clé est absente **et** sans repli.
 */
export function parametre(cle, defaut = '') {
  const valeur = valeurs[cle];
  return valeur === null || valeur === undefined || valeur === '' ? defaut : valeur;
}

/**
 * La valeur d'un réglage numérique.
 *
 * Passe par `nombre()` : `valeur` est du texte en base, et un réglage vide
 * rendrait `NaN`, qui s'affiche tel quel dans un gabarit.
 *
 * @param {string} cle
 * @param {number} [defaut]
 */
export function parametreNombre(cle, defaut = 0) {
  const brut = valeurs[cle];
  if (brut === null || brut === undefined || brut === '') return defaut;
  return nombre(brut);
}

/**
 * Formate un montant avec la devise réglée.
 *
 * Remplace les copies locales de `formatCurrency` et le « FCFA » écrit en dur
 * dans dix-neuf fichiers. `nombre()` absorbe au passage le piège maison : `pg`
 * sert les `NUMERIC` en chaînes, et `'12000'` sans conversion se concatène au
 * lieu de s'additionner.
 *
 * @param {any} valeur
 * @param {{decimales?: number}} [options]
 */
export function formatMontant(valeur, { decimales = 0 } = {}) {
  const montant = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(nombre(valeur));

  return `${montant} ${parametre('finances.devise_symbole', 'FCFA')}`.trim();
}

/**
 * L'identité de l'établissement, pour les en-têtes de documents.
 *
 * Les champs facultatifs non renseignés sont rendus **vides** et non remplacés
 * par un tiret : un en-tête de document officiel ne doit pas afficher
 * « Téléphone : — ». C'est à l'appelant d'écarter les lignes vides.
 */
export function identiteEtablissement() {
  return {
    nom: parametre('etablissement.nom'),
    sigle: parametre('etablissement.sigle'),
    adresse: parametre('etablissement.adresse'),
    telephone: parametre('etablissement.telephone'),
    email: parametre('etablissement.email'),
    siteWeb: parametre('etablissement.site_web'),
  };
}
