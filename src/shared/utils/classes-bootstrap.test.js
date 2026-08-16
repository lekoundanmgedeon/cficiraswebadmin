import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Aucune classe Bootstrap employée ne doit être absente de la feuille du projet.
 *
 * ## Le défaut que ce test attrape
 *
 * L'écran Paramètres est parti en production avec des **intitulés et des rôles
 * invisibles** : les badges portaient `bg-primary-subtle text-primary-emphasis`,
 * deux utilitaires **apparus dans Bootstrap 5.3** et absents de
 * `src/assets/css/style.css`, qui est antérieure. Résultat : aucun fond, aucune
 * couleur de texte — et `.badge` impose `color: #fff` en dur (ligne 13986).
 * Du blanc sur blanc.
 *
 * Rien ne l'avait signalé. Une classe CSS inexistante ne lève aucune erreur, ne
 * casse aucun test de montage, ne fait pas échouer le build : elle ne fait
 * simplement rien. C'est le pire des défauts d'affichage, et le seul moyen de le
 * voir est de comparer les classes écrites à celles qui existent — ce que fait
 * ce test.
 *
 * ## Ce qu'il ne couvre pas
 *
 * Les classes composées dans un gabarit (`` `text-${couleur}` ``) : leur nom
 * n'existe qu'à l'exécution. Les modules concernés les construisent à partir de
 * tables de constantes dont les valeurs sont, elles, des couleurs Bootstrap
 * standard — mais ce test ne peut pas le vérifier.
 */

const RACINE = dirname(dirname(dirname(fileURLToPath(import.meta.url)))); // → src/
const FEUILLE = join(RACINE, 'assets/css/style.css');

/**
 * Les modules vérifiés.
 *
 * Volontairement restreint plutôt qu'étendu à tout `src` : le code hérité porte
 * des classes de gabarits tiers que ce dépôt n'a pas vocation à valider ici, et
 * un test qui échoue pour des raisons connues n'est plus lu.
 *
 * ⚠️ **`espace-notes` en est écarté, et il faut savoir pourquoi.** Il emploie lui
 * aussi des `bg-*-subtle` absents de la feuille, mais **associés à une classe de
 * couleur qui existe** (`bg-secondary-subtle text-secondary`). Son texte reste
 * donc lisible : seul le fond teinté manque, et `fw-semibold` y rend un poids
 * normal. C'est une dégradation visuelle, pas le blanc-sur-blanc corrigé ici —
 * et ce n'est pas le même geste que de la corriger.
 */
const MODULES = ['modules/parametres', 'modules/assistant'];

/** Les préfixes d'utilitaires de couleur et de graisse — ceux qui rendent invisible. */
const SURVEILLES = /^(text|bg|border|fw|fs)-[a-z0-9-]+$/;

const feuille = readFileSync(FEUILLE, 'utf8');

/** La feuille déclare-t-elle cette classe ? */
function declaree(classe) {
  return new RegExp(`(^|,\\s*)\\.${classe}[\\s,{:.]`, 'm').test(feuille);
}

function fichiersVue(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return fichiersVue(chemin);
    return entree.name.endsWith('.vue') ? [chemin] : [];
  });
}

/** Les classes statiques d'un fichier — celles écrites en toutes lettres. */
function classesDe(contenu) {
  const trouvees = new Set();

  for (const [, valeur] of contenu.matchAll(/\sclass="([^"{}$]*)"/g)) {
    for (const classe of valeur.split(/\s+/).filter(Boolean)) trouvees.add(classe);
  }

  return [...trouvees];
}

describe('Les classes Bootstrap employées existent dans la feuille du projet', () => {
  const fichiers = MODULES.flatMap((m) => fichiersVue(join(RACINE, m)));

  it('trouve bien des fichiers à inspecter', () => {
    // Un test qui n'inspecte rien passerait toujours.
    expect(fichiers.length).toBeGreaterThan(15);
  });

  it('connaît la feuille de styles', () => {
    // Si le chemin change, le test doit échouer bruyamment plutôt que de
    // déclarer toutes les classes absentes — ou toutes présentes.
    expect(feuille.length).toBeGreaterThan(100000);
    expect(declaree('text-muted')).toBe(true);
  });

  it('n’emploie aucun utilitaire absent de la feuille', () => {
    const manquants = [];

    for (const chemin of fichiers) {
      for (const classe of classesDe(readFileSync(chemin, 'utf8'))) {
        if (!SURVEILLES.test(classe) || declaree(classe)) continue;
        manquants.push(`${relative(RACINE, chemin)} → .${classe}`);
      }
    }

    expect(manquants).toEqual([]);
  });

  it('confirme que les utilitaires de Bootstrap 5.3 sont bien hors de portée', () => {
    // C'est la prémisse du test : si la feuille était mise à jour un jour, ces
    // classes deviendraient légitimes et il faudrait le savoir.
    expect(declaree('bg-primary-subtle')).toBe(false);
    expect(declaree('text-primary-emphasis')).toBe(false);
    expect(declaree('text-body-secondary')).toBe(false);
    expect(declaree('fw-semibold')).toBe(false);
  });
});
