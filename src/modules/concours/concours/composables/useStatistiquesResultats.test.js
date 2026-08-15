import { describe, expect, it } from 'vitest';
import {
  indicateursClassement,
  repartitionDecisions,
  repartitionParPalier,
  repartitionParSexe,
  statistiquesParEpreuve,
} from './useStatistiquesResultats';

/**
 * Charge utile réelle de `GET /concours/:id/classement`.
 *
 * `pg` sert ses `NUMERIC` en **chaînes**, et `moyenne_generale` arrive non
 * arrondie (« 16.6818181818181818 ») : c'est le piège que ces tests verrouillent,
 * une moyenne de moyennes concaténant en silence sans conversion.
 */
const CLASSEMENT = [
  {
    candidat_id: 'k1',
    num_table: 'T-0001',
    nom: 'NGANGA',
    prenom: 'Orphée',
    sexe: 'F',
    moyenne_generale: '16.6818181818181818',
    rang: '1',
    admis: true,
    decision_jury: 'ADMIS',
    date_proclamation: '2026-08-02T00:24:00.460Z',
  },
  {
    candidat_id: 'k2',
    num_table: 'T-0002',
    nom: 'DIALLO',
    prenom: 'Aïcha',
    sexe: 'F',
    moyenne_generale: '11.00',
    rang: '2',
    admis: true,
    decision_jury: 'ADMIS',
    date_proclamation: '2026-08-02T00:24:00.460Z',
  },
  {
    candidat_id: 'k3',
    num_table: 'T-0003',
    nom: 'BAH',
    prenom: 'Ousmane',
    sexe: 'M',
    moyenne_generale: '9.50',
    rang: '3',
    admis: false,
    decision_jury: 'LISTE_ATTENTE',
    date_proclamation: '2026-08-02T00:24:00.460Z',
  },
  {
    candidat_id: 'k4',
    num_table: 'T-0004',
    nom: 'CAMARA',
    prenom: 'Sekou',
    sexe: 'M',
    moyenne_generale: '4.00',
    rang: '4',
    admis: false,
    decision_jury: 'A_A_JOURNER',
    date_proclamation: '2026-08-02T00:24:00.460Z',
  },
];

const EPREUVES = [
  { id: 'e1', code: 'CG', designation: 'Culture générale', coefficient: 2, ordre: 1 },
  { id: 'e2', code: 'MATH', designation: 'Mathématiques', coefficient: 3, ordre: 2 },
];

const NOTES = {
  CG: [
    { num_table: 'T-0001', note: '18.00' },
    { num_table: 'T-0002', note: '12.00' },
    { num_table: 'T-0003', note: '6.00' },
    // Candidat présent mais non noté : la jointure est un LEFT JOIN.
    { num_table: 'T-0004', note: null },
  ],
  MATH: [
    { num_table: 'T-0001', note: '15.00' },
    { num_table: 'T-0002', note: '10.00' },
  ],
};

describe('statistiques de résultats — indicateurs', () => {
  it('convertit les chaînes servies par pg au lieu de les concaténer', () => {
    const { nbClasses, moyenne, max, min } = indicateursClassement(CLASSEMENT);

    expect(nbClasses).toBe(4);
    // (16.6818… + 11 + 9.5 + 4) / 4
    expect(moyenne).toBeCloseTo(10.295454545, 6);
    expect(max).toBeCloseTo(16.681818, 5);
    expect(min).toBe(4);
  });

  it('calcule un écart-type de population, pas une valeur au hasard', () => {
    const { moyenne, ecartType } = indicateursClassement(CLASSEMENT);
    // La valeur est reprise de la charge utile, et non réécrite en littéral :
    // `16.6818181818181818` dépasse la précision d'un double et serait tronqué
    // différemment ici et là.
    const valeurs = CLASSEMENT.map((ligne) => Number(ligne.moyenne_generale));
    const attendu = Math.sqrt(
      valeurs.reduce((total, v) => total + (v - moyenne) ** 2, 0) / valeurs.length
    );

    expect(ecartType).toBeCloseTo(attendu, 6);
  });

  it('ne renvoie ni NaN ni zéro trompeur quand rien n’est classé', () => {
    expect(indicateursClassement([])).toEqual({
      nbClasses: 0,
      moyenne: null,
      max: null,
      min: null,
      ecartType: null,
    });
  });
});

describe('statistiques de résultats — distribution', () => {
  it('range chaque candidat dans un seul palier', () => {
    const paliers = repartitionParPalier(CLASSEMENT);
    const parCle = Object.fromEntries(paliers.map((palier) => [palier.cle, palier.nb]));

    expect(parCle['0-5']).toBe(1); // 4.00
    expect(parCle['8-10']).toBe(1); // 9.50
    expect(parCle['10-12']).toBe(1); // 11.00
    expect(parCle['16-20']).toBe(1); // 16.68
    expect(paliers.reduce((somme, palier) => somme + palier.nb, 0)).toBe(4);
  });

  it('compte une moyenne de 20 — la borne haute est incluse', () => {
    const paliers = repartitionParPalier([{ moyenne_generale: '20.00' }]);
    expect(paliers.find((palier) => palier.cle === '16-20').nb).toBe(1);
  });

  it('donne la part de chaque palier', () => {
    const paliers = repartitionParPalier(CLASSEMENT);
    expect(paliers.find((palier) => palier.cle === '10-12').part).toBe(25);
  });
});

describe('statistiques de résultats — décisions du jury', () => {
  it('lit la délibération réelle, et non une simulation à un seuil', () => {
    const decisions = repartitionDecisions(CLASSEMENT);

    expect(decisions.proclame).toBe(true);
    expect(decisions.nbProclames).toBe(4);
    expect(decisions.lignes.map((ligne) => [ligne.code, ligne.nb])).toEqual([
      ['ADMIS', 2],
      ['LISTE_ATTENTE', 1],
      ['A_A_JOURNER', 1],
    ]);
    expect(decisions.tauxAdmission).toBe(50);
    expect(decisions.date).toBe('2026-08-02T00:24:00.460Z');
  });

  it('distingue « non proclamé » de « tout le monde en attente »', () => {
    // eslint-disable-next-line no-unused-vars -- déstructuration pour omettre
    const sansDecision = CLASSEMENT.map(({ decision_jury, admis, ...reste }) => reste);
    const decisions = repartitionDecisions(sansDecision);

    expect(decisions.proclame).toBe(false);
    expect(decisions.lignes).toEqual([]);
    // Un taux nul serait faux : il n'y a pas de taux tant qu'il n'y a pas de jury.
    expect(decisions.tauxAdmission).toBeNull();
  });
});

describe('statistiques de résultats — par épreuve', () => {
  it('calcule moyenne, bornes et taux de réussite sur les seules notes chiffrées', () => {
    const [cg, math] = statistiquesParEpreuve(EPREUVES, NOTES);

    expect(cg.nbCandidats).toBe(4);
    expect(cg.nbNotes).toBe(3); // la ligne à `null` ne compte pas
    expect(cg.moyenne).toBe(12); // (18 + 12 + 6) / 3
    expect(cg.max).toBe(18);
    expect(cg.min).toBe(6);
    expect(cg.tauxReussite).toBeCloseTo((2 / 3) * 100, 6);

    expect(math.coefficient).toBe(3);
    expect(math.moyenne).toBe(12.5);
  });

  it('rend une épreuve sans note lisible plutôt que zéro', () => {
    const [sansNote] = statistiquesParEpreuve([EPREUVES[0]], { CG: [] });

    expect(sansNote.nbNotes).toBe(0);
    expect(sansNote.moyenne).toBeNull();
    expect(sansNote.tauxReussite).toBeNull();
  });

  it('ne compte jamais une absence de note comme un zéro', () => {
    // `Number(null)` vaut 0 : sans garde, ce candidat non noté ferait chuter la
    // moyenne de l'épreuve à 9 et le taux de réussite à 50 %.
    const [stats] = statistiquesParEpreuve([EPREUVES[0]], {
      CG: [
        { num_table: 'T-0001', note: '18.00' },
        { num_table: 'T-0002', note: null },
        { num_table: 'T-0003', note: '' },
      ],
    });

    expect(stats.nbCandidats).toBe(3);
    expect(stats.nbNotes).toBe(1);
    expect(stats.moyenne).toBe(18);
    expect(stats.min).toBe(18);
    expect(stats.tauxReussite).toBe(100);
  });
});

describe('statistiques de résultats — répartition par sexe', () => {
  it('donne le taux d’admission de chaque sexe', () => {
    const parSexe = repartitionParSexe(CLASSEMENT);

    expect(parSexe).toEqual([
      { code: 'M', label: 'Masculin', nb: 2, admis: 0, tauxAdmission: 0 },
      { code: 'F', label: 'Féminin', nb: 2, admis: 2, tauxAdmission: 100 },
    ]);
  });

  it('n’affiche pas un sexe absent du classement', () => {
    const parSexe = repartitionParSexe([CLASSEMENT[0]]);
    expect(parSexe.map((ligne) => ligne.code)).toEqual(['F']);
  });
});
