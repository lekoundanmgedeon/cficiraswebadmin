import { describe, expect, it } from 'vitest';
import { escapeHtml, escapeRegExp, highlight, tronquer } from './text';

describe('escapeHtml', () => {
  it('neutralise les balises', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
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

describe('tronquer', () => {
  it('laisse intact ce qui tient dans la limite', () => {
    expect(tronquer('Combien d’étudiants ?', 80)).toBe('Combien d’étudiants ?');
  });

  it('coupe sur le dernier espace plutôt qu’au milieu d’un mot', () => {
    // « recouv… » se lit plus mal que la perte du mot entier.
    expect(tronquer('Quel est le reste à recouvrer par filière ?', 26)).toBe(
      'Quel est le reste à…'
    );
  });

  it('coupe net quand le dernier espace est trop tôt', () => {
    // Sans ce garde-fou, une chaîne sans espace tardif se réduirait à deux
    // lettres suivies d'une ellipse.
    expect(tronquer('Récapitulatif budgétaire annuel consolidé', 12)).toBe('Récapitulati…');
  });

  it('accepte une entrée absente', () => {
    expect(tronquer(null)).toBe('');
    expect(tronquer(undefined)).toBe('');
  });
});
