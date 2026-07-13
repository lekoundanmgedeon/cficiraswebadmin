import { describe, expect, it } from 'vitest';
import { escapeHtml, escapeRegExp, highlight } from './text';

describe('escapeHtml', () => {
  it('neutralise les balises', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('tolère null et undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('escapeRegExp', () => {
  it('échappe les métacaractères', () => {
    expect(escapeRegExp('a(b)*')).toBe('a\\(b\\)\\*');
  });
});

describe('highlight', () => {
  it('entoure le terme trouvé', () => {
    expect(highlight('Semestre 1', 'sem')).toContain('<mark');
    expect(highlight('Semestre 1', 'sem')).toContain('Sem</mark>');
  });

  it('renvoie le texte échappé quand la recherche est vide', () => {
    expect(highlight('Semestre 1', '')).toBe('Semestre 1');
  });

  // Le résultat part dans un `v-html` : aucun HTML venant de la donnée backend
  // ne doit survivre à l'appel.
  it('échappe le HTML de la donnée avant d’insérer le balisage', () => {
    const result = highlight('<img src=x onerror=alert(1)>', '');
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  it('ne laisse pas passer de HTML même quand un terme correspond', () => {
    const result = highlight('<b>Semestre</b>', 'Semestre');
    expect(result).not.toContain('<b>');
    expect(result).toContain('<mark');
  });

  // L'ancienne implémentation construisait la RegExp sans échapper la saisie :
  // rechercher « ( » levait une SyntaxError et cassait tout le filtre.
  it('ne plante pas sur une recherche contenant des métacaractères', () => {
    expect(() => highlight('Semestre (1)', '(')).not.toThrow();
    expect(() => highlight('Semestre', '*')).not.toThrow();
  });
});
