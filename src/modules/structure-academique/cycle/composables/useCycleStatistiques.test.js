import { describe, expect, it } from 'vitest';
import { analyserCycles, enrichirCycles } from './useCycleStatistiques';

/**
 * Charges utiles réelles des trois lectures croisées.
 *
 * `v_organisation_classes` sert ses `COUNT` et ses `NUMERIC` en **chaînes**, et
 * `v_distribution_cycle` va jusqu'à typer `nb_etudiants` en `TEXT` : c'est le
 * piège que ces tests verrouillent, puisque `'40' + '35'` vaut `'4035'` sans
 * lever la moindre erreur.
 */
const CYCLES = [
  { id: 'c1', code: 'LG', diplome: 'Licence Générale', duree_annees: 3, credits_total: 180 },
  { id: 'c2', code: 'ING', diplome: "Diplôme d'Ingénieur", duree_annees: 5, credits_total: 300 },
  { id: 'c3', code: 'MR', diplome: 'Master Recherche', duree_annees: 2, credits_total: 120 },
];

const CLASSES = [
  {
    id: 'k1',
    classe: 'LG-INFO-L1',
    filiere: 'Informatique',
    cycle_code: 'LG',
    niveau: 'L1',
    effectif: '40',
    capacite: '40',
    taux: '100',
    statut: 'COMPLÈTE',
  },
  {
    id: 'k2',
    classe: 'LG-INFO-L2',
    filiere: 'Informatique',
    cycle_code: 'LG',
    niveau: 'L2',
    effectif: '35',
    capacite: '40',
    taux: '88',
    statut: 'OUVERTE',
  },
  {
    id: 'k3',
    classe: 'LG-MATH-L1',
    filiere: 'Mathématiques',
    cycle_code: 'LG',
    niveau: 'L1',
    effectif: '0',
    capacite: '20',
    taux: '0',
    statut: 'FERMÉE',
  },
  {
    id: 'k4',
    classe: 'ING-GC-L1',
    filiere: 'Génie Civil',
    cycle_code: 'ING',
    niveau: 'L1',
    effectif: '10',
    capacite: '50',
    taux: '20',
    statut: 'OUVERTE',
  },
];

/** Le serveur compte des étudiants **distincts**, la vue des inscriptions. */
const DISTRIBUTION = [
  { cycle_id: 'c1', cycle_code: 'LG', diplome: 'Licence Générale', nb_etudiants: '70' },
  { cycle_id: 'c2', cycle_code: 'ING', diplome: "Diplôme d'Ingénieur", nb_etudiants: '10' },
];

const enrichis = () => enrichirCycles(CYCLES, CLASSES, DISTRIBUTION);
const parCode = (code) => enrichis().find((cycle) => cycle.code === code);

const indicateursDe = (cycles) => {
  const effectifTotal = cycles.reduce((somme, cycle) => somme + cycle.effectif, 0);
  const capaciteTotale = cycles.reduce((somme, cycle) => somme + cycle.capacite, 0);
  return {
    effectifTotal,
    tauxGlobal: capaciteTotale > 0 ? (effectifTotal / capaciteTotale) * 100 : 0,
  };
};

describe('statistiques des cycles — enrichissement', () => {
  it('additionne les effectifs et les capacités des classes du cycle', () => {
    const lg = parCode('LG');

    expect(lg.effectif).toBe(75);
    expect(lg.capacite).toBe(100);
    expect(lg.taux).toBe(75);
    expect(lg.placesRestantes).toBe(25);
    expect(lg.nbClasses).toBe(3);
    expect(lg.tailleMoyenneClasse).toBe(25);
  });

  it('déduit les filières et les niveaux des classes, sans les compter deux fois', () => {
    const lg = parCode('LG');

    expect(lg.filieres).toEqual(['Informatique', 'Mathématiques']);
    expect(lg.nbFilieres).toBe(2);
    expect(lg.niveaux).toEqual(['L1', 'L2']);
  });

  it('prend le libellé dans `diplome` : la table `cycle` n’a pas de colonne `nom`', () => {
    expect(parCode('LG').diplome).toBe('Licence Générale');
    expect(enrichirCycles([{ id: 'x', code: 'X' }], [], [])[0].diplome).toBe('Cycle académique');
  });

  it('conserve le compte serveur des étudiants distincts à côté des inscriptions', () => {
    expect(parCode('LG').etudiantsDistincts).toBe(70); // 75 inscriptions, 70 étudiants
    expect(parCode('MR').etudiantsDistincts).toBe(0); // absent de la distribution
  });

  it('ne divise pas par une capacité nulle et compte les classes en tension', () => {
    const mr = parCode('MR');

    expect(mr.nbClasses).toBe(0);
    expect(mr.taux).toBe(0);
    expect(Number.isNaN(mr.taux)).toBe(false);
    expect(mr.tailleMoyenneClasse).toBe(0);

    const lg = parCode('LG');
    expect(lg.classesSaturees).toBe(1); // LG-INFO-L1 : 40/40
    expect(lg.classesVides).toBe(1); // LG-MATH-L1 : aucun inscrit
  });
});

describe('statistiques des cycles — diagnostics', () => {
  it('dérive ses constats des chiffres, sans les inventer', () => {
    const cycles = enrichis();
    const titres = analyserCycles(cycles, indicateursDe(cycles)).map((analyse) => analyse.titre);

    expect(titres).toContain('1 cycle(s) sans classe'); // MR
    expect(titres).toContain('1 cycle(s) sans inscrit'); // MR
    expect(titres).toContain('1 cycle(s) sous les 40 %'); // ING : 20 %
    expect(titres).toContain('1 classe(s) pleine(s)'); // LG-INFO-L1
    expect(titres).toContain('Effectifs concentrés'); // LG : 75 des 85 inscrits
    expect(titres).toContain('Inscriptions multiples'); // 85 inscriptions, 80 distincts
  });

  it('signale la saturation d’un cycle plutôt que celle de ses classes', () => {
    const cycles = enrichirCycles(
      [CYCLES[0]],
      [{ ...CLASSES[0], effectif: '40', capacite: '40', taux: '100' }],
      []
    );
    const analyses = analyserCycles(cycles, indicateursDe(cycles));

    expect(analyses[0].titre).toBe('1 cycle(s) au complet');
    expect(analyses.map((analyse) => analyse.titre)).not.toContain('1 classe(s) pleine(s)');
  });

  it('signale l’absence de tension quand tout va bien', () => {
    const cycles = enrichirCycles(
      [CYCLES[0]],
      [{ ...CLASSES[1], effectif: '20', capacite: '40', taux: '50' }],
      []
    );
    const titres = analyserCycles(cycles, indicateursDe(cycles)).map((analyse) => analyse.titre);

    expect(titres).toContain('Aucune tension de capacité');
    expect(titres).not.toContain('1 cycle(s) au complet');
  });

  it('n’analyse rien tant qu’aucun cycle n’est chargé', () => {
    expect(enrichirCycles([], [], [])).toEqual([]);
    expect(analyserCycles([], { effectifTotal: 0, tauxGlobal: 0 })).toEqual([]);
  });
});
