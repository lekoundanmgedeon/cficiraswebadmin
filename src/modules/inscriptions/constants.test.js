import { describe, expect, it } from 'vitest';
import {
  TYPES_INSCRIPTION,
  TYPE_INSCRIPTION_DEFAUT,
  formatMoney,
  normalizeStatut,
  statutInfo,
  typeInscriptionLabel,
} from './constants';

/**
 * Le backend parle **deux vocabulaires de statut**, et les valeurs de référence
 * ci-dessous ont été relevées sur le serveur, en croisant les deux endpoints sur
 * les mêmes identifiants d'inscription. Ce test fige cette correspondance : si
 * l'API en ajoute une variante, il tombe ici plutôt que d'afficher « Inconnu »
 * en production.
 */
describe('normalizeStatut', () => {
  it('accepte les codes de GET /inscriptions', () => {
    expect(normalizeStatut('EN_ATTENTE')).toBe('EN_ATTENTE');
    expect(normalizeStatut('VALIDEE')).toBe('VALIDEE');
    expect(normalizeStatut('ACTIVE')).toBe('ACTIVE');
    expect(normalizeStatut('REJETEE')).toBe('REJETEE');
  });

  it('accepte les libellés français de GET /inscriptions/finances', () => {
    expect(normalizeStatut('en attente')).toBe('EN_ATTENTE');
    expect(normalizeStatut('validée')).toBe('VALIDEE');
    expect(normalizeStatut('active')).toBe('ACTIVE');
  });

  it('traduit « annulée » en REJETEE', () => {
    // Le suivi financier rend REJETEE sous le libellé « annulée » — et non
    // « rejetée ». Sans cet alias, un dossier rejeté s'affiche « Inconnu ».
    expect(normalizeStatut('annulée')).toBe('REJETEE');
    expect(normalizeStatut('ANNULEE')).toBe('REJETEE');
  });

  it('ignore la casse, les accents et les espaces', () => {
    expect(normalizeStatut('  En Attente  ')).toBe('EN_ATTENTE');
    expect(normalizeStatut('Diplômé')).toBe('DIPLOME');
  });

  it('renvoie null sur une valeur absente ou inconnue', () => {
    expect(normalizeStatut(null)).toBeNull();
    expect(normalizeStatut('')).toBeNull();
    expect(normalizeStatut('PARTI_EN_VACANCES')).toBeNull();
  });
});

describe('statutInfo', () => {
  it('rend le libellé et la couleur du statut', () => {
    expect(statutInfo('en attente')).toMatchObject({ code: 'EN_ATTENTE', variant: 'warning' });
    expect(statutInfo('annulée')).toMatchObject({ code: 'REJETEE', variant: 'danger' });
  });

  it('retombe sur la valeur brute quand le statut est inconnu', () => {
    expect(statutInfo('SURPRISE')).toMatchObject({ code: 'INCONNU', label: 'SURPRISE' });
  });
});

/**
 * Les trois codes ci-dessous sont ceux de la contrainte
 * `inscriptions_type_inscription_check`, relevée dans le schéma du serveur. Le
 * test les fige : proposer un quatrième code — `REINSCRIPTION`, par exemple —
 * fait échouer la création en `23514`, que le backend remonte en erreur
 * générique. Le formulaire ne doit offrir que ce que la base accepte.
 */
describe('TYPES_INSCRIPTION', () => {
  it('n’offre que les codes acceptés par la contrainte CHECK', () => {
    expect(TYPES_INSCRIPTION.map((type) => type.code)).toEqual([
      'NOUVEAU',
      'REDOUBLANT',
      'TRANSFERT',
    ]);
  });

  it('prend pour défaut celui de la base', () => {
    // `type_inscription varchar(15) DEFAULT 'NOUVEAU' NOT NULL`.
    expect(TYPE_INSCRIPTION_DEFAUT).toBe('NOUVEAU');
    expect(TYPES_INSCRIPTION.some((type) => type.code === TYPE_INSCRIPTION_DEFAUT)).toBe(true);
  });
});

describe('typeInscriptionLabel', () => {
  it('rend le libellé du type, quelle que soit la casse', () => {
    expect(typeInscriptionLabel('NOUVEAU')).toBe('Nouveau');
    expect(typeInscriptionLabel(' redoublant ')).toBe('Redoublant');
  });

  it('rend une valeur inconnue telle quelle plutôt que de la masquer', () => {
    expect(typeInscriptionLabel('REINSCRIPTION')).toBe('REINSCRIPTION');
  });

  it('rend une chaîne vide quand le type est absent', () => {
    expect(typeInscriptionLabel(null)).toBe('');
    expect(typeInscriptionLabel(undefined)).toBe('');
  });
});

describe('formatMoney', () => {
  it('formate les montants, y compris les chaînes renvoyées par l’API', () => {
    // `/inscriptions/finances` renvoie ses montants en chaînes : "1100000.00".
    expect(formatMoney('1100000.00')).toContain('FCFA');
    expect(formatMoney(0)).toBe('0 FCFA');
    expect(formatMoney(null)).toBe('0 FCFA');
  });
});
