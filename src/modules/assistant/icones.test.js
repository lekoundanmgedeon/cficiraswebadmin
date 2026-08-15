import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CADRAGES } from './constants';
import { APERCUS, DOMAINES_CATALOGUE } from './apercus';

/**
 * Un seul jeu d'icônes dans le module : **Bootstrap Icons**.
 *
 * Les deux jeux sont chargés par l'application — `mdi` pour la barre latérale et
 * la plus grande partie des écrans hérités, `bi` (`main.js`) pour l'espace de
 * notes et, désormais, l'assistant. Rien n'empêche donc d'écrire `mdi-` ici :
 * l'icône s'afficherait, et le mélange ne se verrait qu'à l'œil, une glyphe
 * ayant une graisse et une taille optique différentes de ses voisines.
 *
 * D'où ce test, qui balaie les fichiers du module : c'est la seule chose qui
 * empêche le jeu de se remélanger à la prochaine icône ajoutée.
 *
 * ⚠️ Une icône `bi` a besoin de **deux** classes : la base `bi` et le nom
 * `bi-xxx`. Écrire `class="bi-search"` seul ne rend rien du tout — pas même un
 * carré vide —, ce qui est le plus discret des défauts d'affichage. Le second
 * test le verrouille.
 */

const RACINE = dirname(fileURLToPath(import.meta.url));

/** Tous les `.vue` et `.js` du module, tests exclus. */
function fichiersDuModule(dossier = RACINE) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return fichiersDuModule(chemin);
    if (!/\.(vue|js)$/.test(entree.name) || entree.name.includes('.test.')) return [];
    return [chemin];
  });
}

const fichiers = fichiersDuModule().map((chemin) => ({
  chemin: chemin.slice(RACINE.length + 1),
  contenu: readFileSync(chemin, 'utf8'),
}));

describe('Le module n’utilise que Bootstrap Icons', () => {
  it('trouve bien les fichiers à inspecter', () => {
    // Un test qui n'inspecte rien passerait toujours : c'est le garde-fou du
    // garde-fou.
    expect(fichiers.length).toBeGreaterThan(10);
  });

  it('ne contient aucune classe Material Design Icons', () => {
    const fautifs = fichiers
      .filter(({ contenu }) => /\bmdi(-[a-z0-9-]+)?\b/.test(contenu))
      .map(({ chemin }) => chemin);

    expect(fautifs).toEqual([]);
  });

  it('accompagne chaque `bi-xxx` littéral de sa classe de base `bi`', () => {
    // On ne regarde que les attributs de classe statiques : les noms passés par
    // liaison (`:class="amorce.icone"`) reçoivent leur base sur l'élément.
    const fautifs = [];

    for (const { chemin, contenu } of fichiers) {
      for (const [, valeur] of contenu.matchAll(/\sclass="([^"]*\bbi-[^"]*)"/g)) {
        if (!/\bbi\b/.test(valeur)) fautifs.push(`${chemin} → class="${valeur}"`);
      }
    }

    expect(fautifs).toEqual([]);
  });
});

describe('Les icônes déclarées en constantes', () => {
  const declarees = [
    ...Object.values(CADRAGES).map((c) => c.icone),
    ...Object.values(DOMAINES_CATALOGUE).map((d) => d.icone),
    ...Object.values(APERCUS).flatMap((liste) => liste.map((a) => a.icone)),
  ];

  it('nomment toutes une icône Bootstrap', () => {
    // Elles arrivent aux composants par liaison : une faute de préfixe y rend
    // un `<i>` vide, sans erreur ni avertissement.
    expect(declarees.length).toBeGreaterThan(15);
    for (const icone of declarees) expect(icone).toMatch(/^bi-[a-z0-9-]+$/);
  });
});
