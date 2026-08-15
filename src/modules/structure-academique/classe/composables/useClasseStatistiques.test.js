import { describe, expect, it } from 'vitest';
import {
  analyserClasses,
  enrichirClasses,
  regrouperPar,
  repartitionParPalier,
} from './useClasseStatistiques';

/**
 * Charge utile réelle de `v_organisation_classes` : `pg` sert `effectif`,
 * `capacite` et `taux` en **chaînes**, et la vue arrondit le taux à l'entier.
 * C'est ce que ces tests verrouillent — une addition de chaînes concatène en
 * silence, et un taux arrondi fausse toute moyenne qu'on en tirerait.
 */
const LIGNES = [
  {
    id: 'k1',
    classe: 'LG-INFO-L1-A',
    filiere: 'Informatique',
    cycle_code: 'LG',
    cycle: 'Licence Générale',
    niveau: 'L1',
    effectif: '45',
    capacite: '45',
    taux: '100',
    statut: 'COMPLÈTE',
  },
  {
    id: 'k2',
    classe: 'LG-INFO-L2-A',
    filiere: 'Informatique',
    cycle_code: 'LG',
    cycle: 'Licence Générale',
    niveau: 'L2',
    effectif: '35',
    capacite: '40',
    taux: '88',
    statut: 'OUVERTE',
  },
  {
    id: 'k3',
    classe: 'LG-MATH-L1-A',
    filiere: 'Mathématiques',
    cycle_code: 'LG',
    cycle: 'Licence Générale',
    niveau: 'L1',
    effectif: '10',
    capacite: '40',
    taux: '25',
    statut: 'OUVERTE',
  },
  {
    id: 'k4',
    classe: 'ING-GC-L1-A',
    filiere: 'Génie Civil',
    cycle_code: 'ING',
    cycle: "Diplôme d'Ingénieur",
    niveau: 'L1',
    effectif: '0',
    capacite: '30',
    taux: '0',
    statut: 'FERMÉE',
  },
  {
    id: 'k5',
    classe: 'ING-GC-L2-A',
    filiere: 'Génie Civil',
    cycle_code: 'ING',
    cycle: "Diplôme d'Ingénieur",
    niveau: 'L2',
    effectif: '20',
    capacite: '0',
    taux: '0',
    statut: 'FERMÉE',
  },
];

const classes = () => enrichirClasses(LIGNES);

const indicateursDe = (liste) => {
  const effectifTotal = liste.reduce((somme, classe) => somme + classe.effectif, 0);
  const capaciteTotale = liste.reduce((somme, classe) => somme + classe.capacite, 0);
  return {
    effectifTotal,
    capaciteTotale,
    tauxGlobal: capaciteTotale > 0 ? (effectifTotal / capaciteTotale) * 100 : 0,
  };
};

describe('statistiques des classes — normalisation', () => {
  it('convertit les chaînes servies par pg au lieu de les concaténer', () => {
    const liste = classes();
    const total = liste.reduce((somme, classe) => somme + classe.effectif, 0);

    expect(total).toBe(110);
    expect(typeof liste[0].effectif).toBe('number');
  });

  it('recalcule le taux plutôt que de lire celui, arrondi, de la vue', () => {
    const [, deuxieme] = classes();

    // La vue renvoie `88` ; le vrai rapport est 87,5 %.
    expect(deuxieme.taux).toBe(87.5);
  });

  it('ne divise pas par une capacité nulle', () => {
    const sansCapacite = classes().find((classe) => classe.classe === 'ING-GC-L2-A');

    expect(sansCapacite.taux).toBe(0);
    expect(Number.isNaN(sansCapacite.taux)).toBe(false);
    expect(sansCapacite.placesRestantes).toBe(0);
  });
});

describe('statistiques des classes — regroupements', () => {
  it('cumule par filière, du plus peuplé au moins peuplé', () => {
    const groupes = regrouperPar(classes(), 'filiere');

    expect(groupes.map((groupe) => groupe.libelle)).toEqual([
      'Informatique',
      'Génie Civil',
      'Mathématiques',
    ]);

    const [informatique] = groupes;
    expect(informatique.nbClasses).toBe(2);
    expect(informatique.effectif).toBe(80);
    expect(informatique.capacite).toBe(85);
    expect(informatique.tailleMoyenne).toBe(40);
    expect(informatique.classesPleines).toBe(1);
  });

  it('cumule aussi par cycle et par niveau, sans recharger quoi que ce soit', () => {
    const parCycle = regrouperPar(classes(), 'cycle');
    const parNiveau = regrouperPar(classes(), 'niveau');

    expect(parCycle.find((groupe) => groupe.libelle === 'Licence Générale').effectif).toBe(90);
    expect(parNiveau.find((groupe) => groupe.libelle === 'L1').nbClasses).toBe(3);
    expect(parNiveau.find((groupe) => groupe.libelle === 'L1').classesVides).toBe(1);
  });

  it('range chaque classe dans un seul palier de remplissage', () => {
    const paliers = repartitionParPalier(classes());
    const parCle = Object.fromEntries(paliers.map((palier) => [palier.cle, palier.nb]));

    expect(parCle.vides).toBe(1); // ING-GC-L1-A
    expect(parCle.sous_utilisees).toBe(2); // LG-MATH (25 %) et la classe sans capacité
    expect(parCle.tendues).toBe(1); // LG-INFO-L2 (87,5 %)
    expect(parCle.saturees).toBe(1); // LG-INFO-L1 (100 %)
    expect(paliers.reduce((somme, palier) => somme + palier.nb, 0)).toBe(5);
  });
});

describe('statistiques des classes — diagnostics', () => {
  it('dérive ses constats des chiffres, sans les inventer', () => {
    const liste = classes();
    const titres = analyserClasses(liste, indicateursDe(liste)).map((analyse) => analyse.titre);

    expect(titres).toContain('1 classe(s) au complet');
    expect(titres).toContain('1 classe(s) sans capacité déclarée');
    expect(titres).toContain('1 classe(s) sans inscrit');
    expect(titres).toContain('1 classe(s) proches de la saturation');
    expect(titres).toContain('Taille moyenne des classes');
    expect(titres).not.toContain('Aucune tension de capacité');
  });

  it('signale l’absence de tension quand tout va bien', () => {
    const liste = enrichirClasses([{ ...LIGNES[2], effectif: '20', capacite: '40' }]);
    const titres = analyserClasses(liste, indicateursDe(liste)).map((analyse) => analyse.titre);

    expect(titres).toContain('Aucune tension de capacité');
    expect(titres).not.toContain('1 classe(s) au complet');
  });

  it('n’analyse rien tant qu’aucune classe n’est chargée', () => {
    expect(enrichirClasses([])).toEqual([]);
    expect(regrouperPar([], 'filiere')).toEqual([]);
    expect(analyserClasses([], { effectifTotal: 0, capaciteTotale: 0, tauxGlobal: 0 })).toEqual([]);
  });
});
