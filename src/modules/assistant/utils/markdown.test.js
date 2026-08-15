import { describe, expect, it } from 'vitest';
import { rendreMarkdown } from './markdown';

/**
 * Ces tests verrouillent deux choses : que le markdown attendu des réponses
 * s'affiche vraiment (tableaux surtout — c'est la raison d'être du module), et
 * qu'une réponse de modèle ne puisse pas injecter d'HTML. La sortie d'un modèle
 * charrie des libellés venus de la base : elle n'est pas une source de
 * confiance.
 */

describe('Mise en forme', () => {
  it('rend un tableau markdown dans un conteneur défilant', () => {
    const html = rendreMarkdown(
      ['| Filière | Étudiants |', '| --- | ---: |', '| Génie Civil | 125 |'].join('\n')
    );

    expect(html).toContain('table-responsive');
    expect(html).toContain('<th>Filière</th>');
    expect(html).toContain('125');
    // L'alignement demandé par `---:` doit survivre : c'est ce qui rend une
    // colonne de nombres lisible.
    expect(html).toMatch(/align="right"/);
  });

  it('rend les listes et le gras', () => {
    const html = rendreMarkdown('- **125** étudiants\n- 80 en Commerce');

    expect(html).toContain('<li>');
    expect(html).toContain('<strong>125</strong>');
  });

  it('conserve les retours à la ligne simples', () => {
    // Les modèles vont à la ligne sans laisser de ligne vide ; sans `breaks`,
    // les deux constats se colleraient.
    expect(rendreMarkdown('Premier constat\nSecond constat')).toContain('<br>');
  });

  it('rend une chaîne vide sur une réponse vide', () => {
    expect(rendreMarkdown('')).toBe('');
    expect(rendreMarkdown(null)).toBe('');
  });
});

describe('Réponse hostile', () => {
  it('échappe le HTML brut au lieu de l’exécuter', () => {
    const html = rendreMarkdown(
      'Bonjour <img src=x onerror=alert(1)> et <script>alert(1)</script>'
    );

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;img');
  });

  it('désamorce un lien javascript: en le réduisant à son texte', () => {
    const html = rendreMarkdown('[cliquez ici](javascript:alert(1))');

    expect(html).not.toContain('<a ');
    expect(html).toContain('cliquez ici');
  });

  it('garde les liens http et les ouvre sans prise sur la page', () => {
    const html = rendreMarkdown('[doc](https://exemple.org/a)');

    expect(html).toContain('href="https://exemple.org/a"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('remplace une image par son texte alternatif', () => {
    // Une image distante n'a aucun usage ici, et sa requête signalerait la
    // consultation à un tiers.
    const html = rendreMarkdown('![pixel](https://tiers.example/p.gif)');

    expect(html).not.toContain('<img');
    expect(html).toContain('pixel');
  });

  it('n’altère ni les esperluettes ni le code inline', () => {
    const html = rendreMarkdown('R&D et `<b>gras</b>`');

    expect(html).toContain('R&amp;D');
    expect(html).not.toContain('&amp;amp;');
    expect(html).toContain('<code>&lt;b&gt;gras&lt;/b&gt;</code>');
  });
});
