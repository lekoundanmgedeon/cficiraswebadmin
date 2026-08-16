import { beforeEach, describe, expect, it } from 'vitest';
import {
  appliquerParametres,
  formatMontant,
  identiteEtablissement,
  parametre,
  parametreNombre,
} from './parametres';

/**
 * Ce que ces tests verrouillent : **un réglage absent ne casse jamais un
 * affichage**.
 *
 * ⚠️ `Intl.NumberFormat('fr-FR')` sépare les milliers par une **espace fine
 * insécable** (U+202F), pas par l'espace ordinaire qu'on tape au clavier. Les
 * deux sont indiscernables à l'œil, y compris dans un message d'échec de test —
 * d'où les `\u202f` explicites ci-dessous plutôt que des espaces littérales.
 *
 * Ce module est lu hors composant — par `exportPDF` et par tous les formateurs
 * de montants —, souvent avant que `GET /parametres` soit revenu. Un `NaN` ou un
 * `undefined` s'y afficherait tel quel sur un document officiel, sans lever la
 * moindre erreur.
 */

beforeEach(() => {
  // Chaque test repart des valeurs semées par la migration 019.
  appliquerParametres({});
});

describe('Avant toute réponse du serveur', () => {
  it('rend les valeurs semées, pas du vide', () => {
    // Un montant s'affiche au premier rendu : sans repli, la devise
    // disparaîtrait le temps de l'aller-retour.
    expect(formatMontant(12000)).toBe('12\u202f000 FCFA');
    expect(parametre('etablissement.sigle')).toBe('CFI');
  });
});

describe('appliquerParametres', () => {
  it('remplace les valeurs reçues', () => {
    appliquerParametres({ 'finances.devise_symbole': '€' });

    expect(formatMontant(1500)).toBe('1\u202f500 €');
  });

  it('garde le repli des clés absentes de la réponse', () => {
    // Un serveur qui ne connaîtrait pas encore une clé ne doit pas faire
    // disparaître le symbole de la devise de tous les écrans.
    appliquerParametres({ 'etablissement.nom': 'Institut X' });

    expect(parametre('etablissement.nom')).toBe('Institut X');
    expect(formatMontant(100)).toContain('FCFA');
  });

  it('traite une valeur nulle comme absente', () => {
    // `null` est ce que le serveur rend pour un champ facultatif jamais
    // renseigné — l'adresse, par exemple.
    appliquerParametres({ 'etablissement.adresse': null });

    expect(parametre('etablissement.adresse')).toBe('');
    expect(parametre('etablissement.adresse', 'non renseignée')).toBe('non renseignée');
  });
});

describe('formatMontant', () => {
  it('convertit les chaînes servies par pg', () => {
    // `NUMERIC` arrive en chaîne : `'575000.00'` sans conversion se
    // concaténerait au lieu de s'additionner.
    expect(formatMontant('575000.00')).toBe('575\u202f000 FCFA');
  });

  it('rend zéro plutôt que NaN sur une entrée illisible', () => {
    expect(formatMontant(null)).toBe('0 FCFA');
    expect(formatMontant(undefined)).toBe('0 FCFA');
    expect(formatMontant('abc')).toBe('0 FCFA');
  });

  it('accepte des décimales quand on les demande', () => {
    expect(formatMontant('1234.5', { decimales: 2 })).toBe('1\u202f234,50 FCFA');
  });
});

describe('parametreNombre', () => {
  it('lit un réglage numérique', () => {
    expect(parametreNombre('scolarite.moyenne_validation')).toBe(10);
  });

  it('rend le défaut plutôt que NaN sur un réglage vide', () => {
    appliquerParametres({ 'scolarite.moyenne_validation': '' });

    expect(parametreNombre('scolarite.moyenne_validation', 12)).toBe(12);
  });
});

describe('identiteEtablissement', () => {
  it('rend les champs non renseignés vides, jamais un tiret', () => {
    // Un en-tête de document officiel ne doit pas afficher « Téléphone : — » ;
    // c'est à l'appelant d'écarter les lignes vides.
    const identite = identiteEtablissement();

    expect(identite.nom).toBeTruthy();
    expect(identite.telephone).toBe('');
    expect(identite.adresse).toBe('');
  });

  it('reflète les réglages appliqués', () => {
    appliquerParametres({
      'etablissement.nom': 'Institut X',
      'etablissement.telephone': '+237 6 00 00 00 00',
    });

    expect(identiteEtablissement()).toMatchObject({
      nom: 'Institut X',
      telephone: '+237 6 00 00 00 00',
    });
  });
});
