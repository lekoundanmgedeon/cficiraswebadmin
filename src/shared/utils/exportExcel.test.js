import { describe, expect, it } from 'vitest';
import { nomOngletValide } from './exportExcel';

/**
 * Ces tests verrouillent un défaut qui rendait **sept exports inopérants** :
 * `book_append_sheet` lève « Sheet names cannot exceed 31 chars », et le titre
 * d'export — une phrase lisible — était passé tel quel. Le bouton « Exporter »
 * ne produisait alors aucun fichier.
 */
describe('nomOngletValide', () => {
  it('laisse intact un titre assez court', () => {
    expect(nomOngletValide('Liste des classes')).toBe('Liste des classes');
  });

  it('abrège au-delà de la limite du format Excel', () => {
    const titre = 'Calendrier officiel des épreuves — Session normale';
    const onglet = nomOngletValide(titre);

    expect(titre.length).toBeGreaterThan(31);
    expect(onglet.length).toBeLessThanOrEqual(31);
    expect(titre.startsWith(onglet)).toBe(true);
  });

  it('retire les caractères qu’Excel refuse dans un nom d’onglet', () => {
    expect(nomOngletValide('Notes : 2025/2026 [S1]')).toBe('Notes 2025 2026 S1');
  });

  it('ne rend jamais un nom vide', () => {
    expect(nomOngletValide('')).toBe('Feuille1');
    expect(nomOngletValide('///')).toBe('Feuille1');
    expect(nomOngletValide(undefined)).toBe('Feuille1');
  });
});
