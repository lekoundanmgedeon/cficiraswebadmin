import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useFiliereStore } from './store';
import * as api from './api';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Charges utiles réelles des deux vues SQL que l'onglet croise.
 *
 * `v_filiere_details` compte en entiers, `v_organisation_filieres` sert ses
 * `COUNT`, `SUM` et `NUMERIC` en **chaînes** — c'est le piège que ces tests
 * verrouillent : `'9' + '12'` vaut `'912'`, et un total faux ne lève aucune
 * erreur, il s'affiche.
 */
const LISTE = {
  success: true,
  data: [
    {
      id: '2365',
      code: 'GI',
      designation: 'Génie Informatique',
      cycle_id: '67a1',
      cycle_nom: 'Licence',
      nb_classes: 3,
      nb_etudiants: 9,
    },
    {
      id: 'd9fd',
      code: 'ELEC',
      designation: 'Electricite',
      cycle_id: '67a1',
      cycle_nom: 'Licence',
      nb_classes: 2,
      nb_etudiants: 0,
    },
    {
      id: '7b02',
      code: 'GC',
      designation: 'Génie Civil',
      cycle_id: '2600',
      cycle_nom: "Diplôme d'Ingénieur",
      nb_classes: 0,
      nb_etudiants: 0,
    },
  ],
};

const ORGANISATION = {
  success: true,
  data: [
    {
      id: '2365',
      filiere: 'Génie Informatique',
      responsable: 'Non assigné',
      effectif: '12',
      capacite: '12',
      taux: '100.00',
      statut: 'COMPLÈTE',
    },
    {
      id: 'd9fd',
      filiere: 'Electricite',
      responsable: 'Non assigné',
      effectif: '0',
      capacite: '60',
      taux: '0.00',
      statut: 'VIDE',
    },
    {
      id: '7b02',
      filiere: 'Génie Civil',
      responsable: 'Non assigné',
      effectif: '0',
      capacite: '0',
      taux: '0.00',
      statut: 'FERMÉE',
    },
  ],
};

/** Charge les deux lectures dans un store neuf. */
const storeCharge = async () => {
  vi.spyOn(api.filieresResource, 'list').mockResolvedValue(LISTE);
  vi.spyOn(api, 'getFiliereOrganisation').mockResolvedValue(ORGANISATION);

  const store = useFiliereStore();
  await store.fetchAnalyse();
  return store;
};

describe('store des filières — analyse', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear(); // `fetchAll` met la liste en cache d'un test à l'autre.
    vi.restoreAllMocks();
  });

  it('croise les deux vues : la liste seule ignore les capacités', async () => {
    const store = await storeCharge();
    const gi = store.filieresEnrichies.find((filiere) => filiere.code === 'GI');

    expect(gi.capacite).toBe(12);
    expect(gi.cycle).toBe('Licence');
    expect(gi.nbClasses).toBe(3);
    // L'organisation restreint aux inscriptions ACTIVE/VALIDEE : c'est elle qui
    // fait foi sur l'effectif, pas le `nb_etudiants` de la liste.
    expect(gi.effectif).toBe(12);
    expect(gi.taux).toBe(100);
    expect(gi.placesRestantes).toBe(0);
    expect(gi.tailleMoyenneClasse).toBe(4);
  });

  it('ne divise pas par une capacité nulle', async () => {
    const store = await storeCharge();
    const gc = store.filieresEnrichies.find((filiere) => filiere.code === 'GC');

    expect(gc.taux).toBe(0);
    expect(Number.isNaN(gc.taux)).toBe(false);
    expect(gc.tailleMoyenneClasse).toBe(0);
  });

  it("ne retient comme actives que les filières qui comptent un inscrit sur l'année active", async () => {
    const store = await storeCharge();

    expect(store.filieresActives.map((filiere) => filiere.code)).toEqual(['GI']);
    expect(store.filieresSansEffectif.map((filiere) => filiere.code)).toEqual(['ELEC', 'GC']);
  });

  it('additionne les compteurs au lieu de les concaténer', async () => {
    const store = await storeCharge();
    const { effectifTotal, capaciteTotale, placesDisponibles, nbClasses } =
      store.indicateursFilieres;

    expect(effectifTotal).toBe(12);
    expect(capaciteTotale).toBe(72);
    expect(placesDisponibles).toBe(60);
    expect(nbClasses).toBe(5);
    expect(store.indicateursFilieres.tauxGlobal).toBeCloseTo((12 / 72) * 100, 5);
  });

  it('regroupe les effectifs par cycle', async () => {
    const store = await storeCharge();

    expect(store.repartitionParCycle).toEqual([
      { cycle: 'Licence', effectif: 12, capacite: 72, nbFilieres: 2, nbFilieresActives: 1 },
      {
        cycle: "Diplôme d'Ingénieur",
        effectif: 0,
        capacite: 0,
        nbFilieres: 1,
        nbFilieresActives: 0,
      },
    ]);
  });

  it('dérive ses diagnostics des chiffres, sans les inventer', async () => {
    const store = await storeCharge();
    const titres = store.analysesFilieres.map((analyse) => analyse.titre);

    expect(titres).toContain('1 filière(s) au complet'); // GI : 12/12
    expect(titres).toContain('1 filière(s) sans classe'); // GC : aucune classe
    expect(titres).toContain('2 filière(s) sans inscrit'); // ELEC et GC
    expect(titres).not.toContain('Aucune tension de capacité');

    const saturation = store.analysesFilieres.find((analyse) => analyse.ton === 'danger');
    expect(saturation.message).toContain('Génie Informatique');
  });

  it('signale l’absence de tension quand tout va bien', async () => {
    vi.spyOn(api.filieresResource, 'list').mockResolvedValue({
      success: true,
      data: [{ ...LISTE.data[0], nb_classes: 3 }],
    });
    vi.spyOn(api, 'getFiliereOrganisation').mockResolvedValue({
      success: true,
      data: [{ ...ORGANISATION.data[0], effectif: '9', capacite: '60', statut: 'OUVERTE' }],
    });

    const store = useFiliereStore();
    await store.fetchAnalyse();

    const titres = store.analysesFilieres.map((analyse) => analyse.titre);
    expect(titres).toContain('Aucune tension de capacité');
    expect(titres).not.toContain('1 filière(s) au complet');
  });

  it("n'analyse rien tant qu'aucune filière n'est chargée", () => {
    const store = useFiliereStore();

    expect(store.filieresEnrichies).toEqual([]);
    expect(store.analysesFilieres).toEqual([]);
    expect(store.indicateursFilieres.tauxGlobal).toBe(0);
  });
});
