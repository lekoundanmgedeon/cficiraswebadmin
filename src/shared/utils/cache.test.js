import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCache, setCache, removeCache, clearAllCache } from './cache';

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('relit une valeur qui vient d’être écrite', () => {
    setCache('annees', [{ id: 1 }]);
    expect(getCache('annees')).toEqual([{ id: 1 }]);
  });

  it('renvoie null pour une clé absente', () => {
    expect(getCache('inconnue')).toBeNull();
  });

  it('expire une entrée passé son TTL et la supprime', () => {
    vi.useFakeTimers();
    setCache('annees', [{ id: 1 }]);

    vi.advanceTimersByTime(6 * 60 * 1000); // au-delà du TTL par défaut (5 min)

    expect(getCache('annees')).toBeNull();
    expect(localStorage.getItem('cache:annees')).toBeNull();
  });

  it('sert encore une entrée à l’intérieur du TTL', () => {
    vi.useFakeTimers();
    setCache('annees', [{ id: 1 }]);

    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(getCache('annees')).toEqual([{ id: 1 }]);
  });

  // L'ancienne implémentation faisait `JSON.parse` sans garde : une entrée
  // corrompue levait une SyntaxError qui remontait jusqu'au composant.
  it('renvoie null sur une entrée corrompue au lieu de lever', () => {
    localStorage.setItem('cache:annees', '{ ceci nest pas du json');

    expect(() => getCache('annees')).not.toThrow();
    expect(getCache('annees')).toBeNull();
  });

  it('clearAllCache purge le cache sans toucher au jeton', () => {
    localStorage.setItem('token', 'jwt-secret');
    setCache('annees', [{ id: 1 }]);
    setCache('classes', [{ id: 2 }]);

    clearAllCache();

    expect(getCache('annees')).toBeNull();
    expect(getCache('classes')).toBeNull();
    expect(localStorage.getItem('token')).toBe('jwt-secret');
  });

  it('removeCache ne supprime que la clé visée', () => {
    setCache('annees', [{ id: 1 }]);
    setCache('classes', [{ id: 2 }]);

    removeCache('annees');

    expect(getCache('annees')).toBeNull();
    expect(getCache('classes')).toEqual([{ id: 2 }]);
  });
});
