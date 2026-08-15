import { describe, expect, it } from 'vitest';
import { dateISO, IMPORT_PLANNING_SCHEMA } from './constants';

const ligne = (surcharge = {}) => ({
  code_session: 'SN-2025-S1',
  code_module: 'INF101',
  type_eval: 'EXAMEN',
  designation: 'Examen final',
  ponderation: 60,
  date_prevue: '2026-01-15',
  ...surcharge,
});

describe('schéma d’import du planning', () => {
  it('accepte une ligne conforme', () => {
    expect(IMPORT_PLANNING_SCHEMA.validate(ligne())).toEqual([]);
  });

  it('refuse un type d’épreuve absent de la contrainte CHECK', () => {
    // `NORMAL` et `RATTRAPAGE` sont des types de *session* : les enregistrer
    // violerait `CHECK (type_eval IN ('CC','TP','EXAMEN','PROJET'))`.
    const erreurs = IMPORT_PLANNING_SCHEMA.validate(ligne({ type_eval: 'RATTRAPAGE' }));

    expect(erreurs).toHaveLength(1);
    expect(erreurs[0]).toContain('type_eval');
  });

  it('tolère la casse du type d’épreuve', () => {
    expect(IMPORT_PLANNING_SCHEMA.validate(ligne({ type_eval: 'examen' }))).toEqual([]);
  });

  it('refuse une pondération hors des bornes de la table', () => {
    expect(IMPORT_PLANNING_SCHEMA.validate(ligne({ ponderation: 0 }))[0]).toContain('ponderation');
    expect(IMPORT_PLANNING_SCHEMA.validate(ligne({ ponderation: 120 }))[0]).toContain(
      'ponderation'
    );
    expect(IMPORT_PLANNING_SCHEMA.validate(ligne({ ponderation: 'beaucoup' }))[0]).toContain(
      'ponderation'
    );
  });

  it('refuse une date illisible mais accepte une date absente', () => {
    // `new Date('15 janvier')` rend 2001-01-15 : sans analyse stricte, ce
    // libellé serait enregistré comme une date, en silence.
    expect(IMPORT_PLANNING_SCHEMA.validate(ligne({ date_prevue: '15 janvier' }))[0]).toContain(
      'date_prevue'
    );
    expect(IMPORT_PLANNING_SCHEMA.validate(ligne({ date_prevue: '31/02/2026' }))[0]).toContain(
      'date_prevue'
    );
    // `date_prevue` est la seule colonne nullable de `evaluations`.
    expect(IMPORT_PLANNING_SCHEMA.validate(ligne({ date_prevue: '' }))).toEqual([]);
    // La notation française passe, elle : c'est celle qu'on saisit dans un tableur.
    expect(IMPORT_PLANNING_SCHEMA.validate(ligne({ date_prevue: '15/01/2026' }))).toEqual([]);
  });

  it('cumule les erreurs d’une même ligne', () => {
    const erreurs = IMPORT_PLANNING_SCHEMA.validate(
      ligne({ type_eval: 'ORAL', ponderation: 200, date_prevue: 'demain' })
    );

    expect(erreurs).toHaveLength(3);
  });
});

describe('dateISO', () => {
  it('normalise les deux formes que rend SheetJS', () => {
    // `cellDates: true` : une cellule au format date arrive en objet Date,
    // une cellule texte en chaîne.
    expect(dateISO(new Date(2026, 0, 15))).toBe('2026-01-15');
    expect(dateISO('2026-01-15')).toBe('2026-01-15');
  });

  it('accepte la notation française et ses séparateurs usuels', () => {
    expect(dateISO('15/01/2026')).toBe('2026-01-15');
    expect(dateISO('5/1/2026')).toBe('2026-01-05');
    expect(dateISO('15.01.2026')).toBe('2026-01-15');
  });

  it('ne se laisse pas abuser par la tolérance de `new Date`', () => {
    // Ces deux valeurs donnent une date valide à `new Date`, et fausse.
    expect(dateISO('15 janvier')).toBeNull();
    expect(dateISO('15 jan')).toBeNull();
  });

  it('rejette un jour qui n’existe pas plutôt que de le reporter', () => {
    // `new Date(2026, 1, 31)` glisse au 3 mars sans rien signaler.
    expect(dateISO('31/02/2026')).toBeNull();
    expect(dateISO('2026-04-31')).toBeNull();
  });

  it('rend `null` pour une valeur vide ou illisible, jamais « Invalid Date »', () => {
    expect(dateISO('')).toBeNull();
    expect(dateISO(null)).toBeNull();
    expect(dateISO('pas une date')).toBeNull();
    expect(dateISO(new Date('nawak'))).toBeNull();
  });
});
