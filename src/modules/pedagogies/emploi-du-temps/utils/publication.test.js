// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { grillesParClasse, publierEmploiDuTemps } from './publication';

/**
 * Charge utile réelle de `vue_horaire_details` : le jour arrive en
 * **majuscules** (le backend le dérive de la date à l'écriture) et les heures
 * en `time` PostgreSQL, secondes comprises.
 */
const creneau = (surcharge = {}) => ({
  id: Math.random().toString(36).slice(2),
  jour: 'LUNDI',
  heure_debut: '08:00:00',
  heure_fin: '10:00:00',
  type_cours: 'CM',
  classe_code: 'LP-COM-L1-B',
  filiere: 'Commerce et Marketing Digital',
  cycle_code: 'LP',
  semestre: 'S1',
  nom_module: 'Introduction au management',
  enseignant: 'Béatrice MALONGA',
  salle_nom: '302',
  ...surcharge,
});

describe('grille de publication', () => {
  it('compose une page par classe, triée par code', () => {
    const grilles = grillesParClasse([
      creneau({ classe_code: 'LP-COM-L2-A' }),
      creneau({ classe_code: 'LG-INFO-L1-A' }),
      creneau({ classe_code: 'LP-COM-L2-A', jour: 'MARDI' }),
    ]);

    expect(grilles.map((g) => g.classe)).toEqual(['LG-INFO-L1-A', 'LP-COM-L2-A']);
    expect(grilles[1].total).toBe(2);
  });

  it('ne retient que les jours réellement occupés, dans l’ordre de la semaine', () => {
    const grilles = grillesParClasse([
      creneau({ jour: 'VENDREDI' }),
      creneau({ jour: 'MARDI' }),
      creneau({ jour: 'MARDI', heure_debut: '10:00:00', heure_fin: '12:00:00' }),
    ]);

    // Ni lundi ni samedi : une colonne vide sur toutes les pages n'apprend rien.
    expect(grilles[0].jours.map((j) => j.id)).toEqual(['MARDI', 'VENDREDI']);
    expect(grilles[0].jours.map((j) => j.label)).toEqual(['Mardi', 'Vendredi']);
  });

  it('déduit les tranches horaires des données, et les ordonne', () => {
    const grilles = grillesParClasse([
      creneau({ heure_debut: '14:00:00', heure_fin: '16:00:00' }),
      creneau({ heure_debut: '07:30:00', heure_fin: '09:30:00' }),
      creneau({ heure_debut: '07:30:00', heure_fin: '09:30:00', jour: 'MARDI' }),
    ]);

    // Une classe qui commence à 7 h 30 a sa ligne 7 h 30 : rien n'est figé.
    expect(grilles[0].tranches.map((t) => t.label)).toEqual(['07:30 – 09:30', '14:00 – 16:00']);
    // Deux jours partagent la même tranche : une seule ligne, deux cases.
    expect(Object.keys(grilles[0].tranches[0].cases).sort()).toEqual(['LUNDI', 'MARDI']);
  });

  it('garde les deux cours d’un conflit d’agenda plutôt que d’en masquer un', () => {
    const grilles = grillesParClasse([
      creneau({ nom_module: 'Management' }),
      creneau({ nom_module: 'Comptabilité' }),
    ]);

    const cases = grilles[0].tranches[0].cases.LUNDI;
    expect(cases).toHaveLength(2);
    expect(cases.map((c) => c.nom_module)).toEqual(['Management', 'Comptabilité']);
  });

  it('n’invente pas de classe quand le créneau n’en porte pas', () => {
    const grilles = grillesParClasse([creneau({ classe_code: null, classe: null })]);
    expect(grilles[0].classe).toBe('—');
  });
});

describe('ouverture du document', () => {
  let fenetre;

  beforeEach(() => {
    fenetre = {
      document: { write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    };
    vi.spyOn(window, 'open').mockReturnValue(fenetre);
  });

  afterEach(() => vi.restoreAllMocks());

  it('écrit une page de garde et une page par classe', () => {
    const classes = publierEmploiDuTemps([
      creneau({ classe_code: 'A' }),
      creneau({ classe_code: 'B' }),
    ]);

    expect(classes).toBe(2);
    const html = fenetre.document.write.mock.calls[0][0];
    // Page de garde + deux pages de classe.
    expect(html.match(/<section class="page/g)).toHaveLength(3);
    expect(html).toContain('Classes publiées</strong> — 2');
  });

  it('reprend le périmètre annoncé, pour qu’on sache ce que couvre le document', () => {
    publierEmploiDuTemps([creneau()], { perimetre: 'Filière Commerce — 3 classe(s)' });

    const html = fenetre.document.write.mock.calls[0][0];
    expect(html).toContain('Filière Commerce — 3 classe(s)');
  });

  it('échappe le balisage venu des données', () => {
    publierEmploiDuTemps([creneau({ nom_module: '<script>alert(1)</script>' })]);

    const html = fenetre.document.write.mock.calls[0][0];
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('refuse de publier un périmètre vide plutôt que d’ouvrir une page blanche', () => {
    expect(() => publierEmploiDuTemps([])).toThrow(/Aucun créneau à publier/);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('signale une fenêtre bloquée par le navigateur', () => {
    window.open.mockReturnValue(null);
    expect(() => publierEmploiDuTemps([creneau()])).toThrow(/bloquée/);
  });
});
