import { describe, expect, it } from 'vitest';
import {
  analyserCharge,
  normaliserMatrice,
  optionsAnnees,
  regrouperCharge,
} from './useSemestreAnalytique';

/** Charge utile réelle de `get_matrix_analytics`. */
const MATRICE = [
  {
    semestre_id: 's1',
    semestre_code: 'S1',
    filiere: 'Informatique',
    niveau: 'L1',
    nb_ues: 5,
    total_heures: 675,
    moyenne_generale: '13.79',
    statut_maquette: 'Conforme',
  },
  {
    semestre_id: 's1',
    semestre_code: 'S1',
    filiere: 'Mathématiques',
    niveau: 'L1',
    nb_ues: 4,
    total_heures: 100,
    moyenne_generale: '12.61',
    statut_maquette: 'Heures < Minimum',
  },
  {
    semestre_id: 's2',
    semestre_code: 'S2',
    filiere: 'Informatique',
    niveau: 'L1',
    nb_ues: 3,
    total_heures: 225,
    moyenne_generale: '14.02',
    statut_maquette: 'Conforme',
  },
];

const ANNEES = [
  { id: 'a1', code: '2024-2025', statut: 'CLOTUREE', est_active: false },
  { id: 'a2', code: '2025-2026', statut: 'OUVERTE', est_active: true },
  { id: 'a3', code: '2026-2027', statut: 'PLANIFIEE', est_active: false },
];

describe('analytique des semestres — sélecteur d’année', () => {
  it('propose toutes les années enregistrées, la plus récente d’abord', () => {
    const options = optionsAnnees(ANNEES);

    // L'ancien sélecteur calculait deux options depuis la date du jour : les
    // années antérieures présentes en base étaient inatteignables.
    expect(options.map((option) => option.value)).toEqual(['2026-2027', '2025-2026', '2024-2025']);
    expect(options[1].label).toBe('2025-2026 (en cours)');
    expect(options[0].label).toBe('2026-2027');
  });

  it('ignore les années sans code : elles ne peuvent pas être demandées au serveur', () => {
    expect(optionsAnnees([{ id: 'x' }, ...ANNEES])).toHaveLength(3);
    expect(optionsAnnees([])).toEqual([]);
  });
});

describe('analytique des semestres — matrice', () => {
  it('donne une clé de liste unique : `semestre_id` se répète d’une filière à l’autre', () => {
    const lignes = normaliserMatrice(MATRICE);
    const cles = new Set(lignes.map((ligne) => ligne.cle));

    expect(cles.size).toBe(3);
  });

  it('déduit le volume moyen par UE au lieu de la moyenne aléatoire du serveur', () => {
    const [premiere] = normaliserMatrice(MATRICE);

    expect(premiere.heuresParUe).toBe(135); // 675 h / 5 UE
    expect(premiere).not.toHaveProperty('moyenneGenerale');
  });

  it('ne divise pas par zéro quand la maquette est vide', () => {
    const [vide] = normaliserMatrice([{ ...MATRICE[0], nb_ues: 0, total_heures: 0 }]);

    expect(vide.heuresParUe).toBe(0);
    expect(Number.isNaN(vide.heuresParUe)).toBe(false);
  });

  it('cumule par semestre et par filière avec leur part du volume', () => {
    const lignes = normaliserMatrice(MATRICE);
    const parSemestre = regrouperCharge(lignes, 'semestre');

    expect(parSemestre.map((groupe) => groupe.libelle)).toEqual(['S1', 'S2']);
    expect(parSemestre[0].heures).toBe(775);
    expect(parSemestre[0].nbUes).toBe(9);
    expect(parSemestre[0].nbConformes).toBe(1);
    expect(parSemestre[0].part).toBeCloseTo((775 / 1000) * 100, 5);

    const parFiliere = regrouperCharge(lignes, 'filiere');
    expect(parFiliere[0]).toMatchObject({ libelle: 'Informatique', heures: 900, nbLignes: 2 });
  });
});

describe('analytique des semestres — diagnostics', () => {
  const indicateurs = { nbConformes: 2, heuresParUe: 100 };

  it('signale les maquettes sous le volume minimal', () => {
    const analyses = analyserCharge(normaliserMatrice(MATRICE), indicateurs);
    const titres = analyses.map((analyse) => analyse.titre);

    expect(titres).toContain('1 maquette(s) sous le volume minimal');
    expect(titres).toContain('Charge inégale entre semestres');
    expect(titres).toContain('Volume moyen par unité');
    expect(analyses[0].message).toContain('Mathématiques');
  });

  it('confirme la conformité quand toutes les maquettes atteignent le seuil', () => {
    const conformes = MATRICE.filter((ligne) => ligne.statut_maquette === 'Conforme');
    const titres = analyserCharge(normaliserMatrice(conformes), indicateurs).map(
      (analyse) => analyse.titre
    );

    expect(titres).toContain('Toutes les maquettes atteignent le volume minimal');
  });

  it('signale une maquette ouverte mais vide', () => {
    const lignes = normaliserMatrice([{ ...MATRICE[0], nb_ues: 0, total_heures: 0 }]);
    const titres = analyserCharge(lignes, indicateurs).map((analyse) => analyse.titre);

    expect(titres).toContain("1 maquette(s) sans unité d'enseignement");
  });

  it('n’analyse rien tant que la matrice est vide', () => {
    expect(normaliserMatrice([])).toEqual([]);
    expect(analyserCharge([], indicateurs)).toEqual([]);
    expect(regrouperCharge([], 'semestre')).toEqual([]);
  });
});
