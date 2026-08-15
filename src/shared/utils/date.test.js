import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { daysBetween, formatDate, formatDateTime, formatMonthYear, formatRelatif } from './date';

describe('Formatage des dates', () => {
  it('rend une date longue', () => {
    expect(formatDate('2025-10-01')).toBe('01 octobre 2025');
  });

  it('rend le mois et l’année', () => {
    expect(formatMonthYear('2025-10-01')).toBe('oct. 2025');
  });

  it('rend un repli sur une entrée absente ou corrompue', () => {
    // Les copies éparpillées de ce formateur rendaient « Invalid Date » ; c'est
    // ce que cette implémentation unique évite.
    expect(formatDate(null)).toBe('-');
    expect(formatDate('pas une date')).toBe('-');
    expect(formatDateTime(undefined, '—')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('conserve l’heure, que `formatDate` jette', () => {
    // `toLocaleDateString` ignore `hour` et `minute` sans rien signaler : c'est
    // la raison d'être d'une fonction distincte plutôt que d'une option de plus.
    const rendu = formatDateTime('2026-08-15T17:34:00');

    expect(rendu).toContain('15 août 2026');
    expect(rendu).toMatch(/17:34/);
  });
});

describe('formatRelatif', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ne compte pas les secondes en deçà de la minute', () => {
    // Le compte exact n'apprend rien et change à chaque rendu.
    expect(formatRelatif('2026-08-15T11:59:40Z')).toBe("à l'instant");
  });

  it('compte en minutes, puis en heures', () => {
    expect(formatRelatif('2026-08-15T11:57:00Z')).toBe('il y a 3 minutes');
    expect(formatRelatif('2026-08-15T09:00:00Z')).toBe('il y a 3 heures');
  });

  it('dit « hier » plutôt que « il y a 1 jour »', () => {
    // `numeric: 'auto'` : c'est ce qui distingue une liste de conversations
    // lisible d'un relevé de compteurs.
    expect(formatRelatif('2026-08-14T12:00:00Z')).toBe('hier');
  });

  it('passe aux mois puis aux années', () => {
    expect(formatRelatif('2026-06-15T12:00:00Z')).toBe('il y a 2 mois');
    expect(formatRelatif('2024-08-15T12:00:00Z')).toBe('il y a 2 ans');
  });

  it('rend une date future telle quelle', () => {
    // Sur un poste dont l'horloge avance, « il y a -3 secondes » serait la
    // seule autre issue honnête, et elle est illisible.
    expect(formatRelatif('2026-08-15T12:05:00Z')).toBe('dans 5 minutes');
  });

  it('rend un repli sur une entrée corrompue', () => {
    expect(formatRelatif(null)).toBe('-');
    expect(formatRelatif('pas une date')).toBe('-');
  });
});

describe('daysBetween', () => {
  it('compte les jours entre deux dates', () => {
    expect(daysBetween('2025-10-01', '2025-10-15')).toBe(14);
  });

  it('rend null si une date est invalide', () => {
    expect(daysBetween('pas une date', '2025-10-15')).toBeNull();
  });
});
