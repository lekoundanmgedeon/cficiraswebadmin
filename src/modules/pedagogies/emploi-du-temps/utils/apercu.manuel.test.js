// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { grillesParClasse, publierEmploiDuTemps } from './publication';

/**
 * Aperçu du document publié, composé avec de **vraies** données.
 *
 * Ce fichier n'est pas un test de régression : il rejoue la composition sur un
 * extrait de `vue_horaire_details` et écrit le document dans le dossier de
 * travail, pour qu'on puisse l'ouvrir dans un navigateur et juger la mise en
 * page. Il ne s'exécute que si l'extrait est présent — sinon il est ignoré,
 * pour ne pas casser la suite sur une machine qui n'a pas la base.
 */

const EXTRAIT = process.env.APERCU_CRENEAUX;
const SORTIE = process.env.APERCU_SORTIE;

describe.runIf(EXTRAIT && fs.existsSync(EXTRAIT))('aperçu du document publié', () => {
  it('compose une grille lisible à partir de données réelles', () => {
    const creneaux = JSON.parse(fs.readFileSync(EXTRAIT, 'utf8'));

    const grilles = grillesParClasse(creneaux);
    for (const grille of grilles) {
      // Chaque page a des colonnes et des lignes : une grille sans l'une des
      // deux ne serait qu'un cadre vide.
      expect(grille.jours.length).toBeGreaterThan(0);
      expect(grille.tranches.length).toBeGreaterThan(0);
    }

    let html = '';
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: (contenu) => (html = contenu), close: () => {} },
      focus: () => {},
      print: () => {},
    });

    const classes = publierEmploiDuTemps(creneaux, {
      perimetre: `${grilles.length} classe(s) — extrait de contrôle`,
      periode: 'Semestre S1',
    });

    expect(classes).toBe(grilles.length);

    if (SORTIE) {
      fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
      fs.writeFileSync(SORTIE, html, 'utf8');
    }
  });
});
