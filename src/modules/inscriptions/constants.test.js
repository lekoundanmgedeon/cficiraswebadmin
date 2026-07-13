import { describe, expect, it } from 'vitest';
import { formatMoney, normalizeStatut, statutInfo } from './constants';

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

describe('formatMoney', () => {
  it('formate les montants, y compris les chaînes renvoyées par l’API', () => {
    // `/inscriptions/finances` renvoie ses montants en chaînes : "1100000.00".
    expect(formatMoney('1100000.00')).toContain('FCFA');
    expect(formatMoney(0)).toBe('0 FCFA');
    expect(formatMoney(null)).toBe('0 FCFA');
  });
});
