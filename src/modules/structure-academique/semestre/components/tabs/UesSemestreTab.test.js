// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as semestreApi from '../../api';
import * as classeApi from '../../../classe/api';
import * as moduleApi from '@/modules/matieres/api';
import UesSemestreTab from './UesSemestreTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * `GET /semestres/courants/actifs` renvoie les semestres de l'**année active**,
 * et non ceux dont `est_actif` est vrai : les deux notions coexistent dans la
 * même charge utile, et c'est `est_actif` qui dit lequel est en cours.
 */
const ACTIFS = {
  success: true,
  data: [
    {
      id: 's1',
      code: 'S1',
      annee_academique_code: '2025-2026',
      date_debut: '2025-10-01',
      date_fin: '2026-02-28',
      est_actif: false,
    },
    {
      id: 's2',
      code: 'S2',
      annee_academique_code: '2025-2026',
      date_debut: '2026-03-01',
      date_fin: '2026-07-31',
      est_actif: true,
    },
  ],
};

const CLASSES = {
  success: true,
  data: [
    {
      id: 'c1',
      code: 'GI-L1',
      capacite_max: 30,
      niveau_id: 'n1',
      filiere_id: 'f1',
      niveau_code: 'L1',
      filiere_nom: 'Génie Informatique',
      nb_etudiants: 9,
    },
    {
      id: 'c2',
      code: 'ELEC-L1',
      capacite_max: 20,
      niveau_id: 'n1',
      filiere_id: 'f2',
      niveau_code: 'L1',
      filiere_nom: 'Electricite',
      nb_etudiants: 5,
    },
  ],
};

/** `v_semestre_configurations` est bâtie sur `ModuleClasse` : seule `c1` y est. */
const CONFIGURATIONS = {
  success: true,
  data: [
    {
      id: 's2_c1',
      semestre_id: 's2',
      classe_id: 'c1',
      code: 'S2',
      periode: '2025-2026',
      filiere: 'Génie Informatique',
      niveau: 'Licence (L1)',
    },
  ],
};

/** `v_module_classe_semestres` dit `libelle`, `credits`, `heures`. */
const UES = {
  success: true,
  data: [
    {
      attribution_id: 'mc1',
      semestre_id: 's2',
      classe_id: 'c1',
      module_id: 'm1',
      code: 'ALG1',
      libelle: 'Algorithmique',
      credits: 6,
      heures: 50,
    },
    {
      attribution_id: 'mc2',
      semestre_id: 's2',
      classe_id: 'c1',
      module_id: 'm2',
      code: 'BD1',
      libelle: 'Bases de données',
      credits: 4,
      heures: 30,
    },
  ],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglet « Unités d’enseignement » des semestres', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const monter = async () => {
    vi.spyOn(semestreApi, 'getActiveSemestres').mockResolvedValue(ACTIFS);
    vi.spyOn(classeApi.classesResource, 'list').mockResolvedValue(CLASSES);
    vi.spyOn(moduleApi, 'getSemestresConfiguration').mockResolvedValue(CONFIGURATIONS);
    vi.spyOn(moduleApi, 'getUesByConfiguration').mockImplementation((semestreId, classeId) =>
      Promise.resolve(semestreId === 's2' && classeId === 'c1' ? UES : { success: true, data: [] })
    );

    const wrapper = mount(UesSemestreTab);
    await flushPromises();
    return wrapper;
  };

  it('ouvre le semestre en cours, et une classe qui porte des UE', async () => {
    const wrapper = await monter();

    expect(wrapper.find('#semestre-select').element.value).toBe('s2');
    expect(wrapper.find('#classe-ue-select').element.value).toBe('c1');
    expect(moduleApi.getUesByConfiguration).toHaveBeenCalledWith('s2', 'c1');

    const texte = texteNormalise(wrapper);
    expect(texte).toContain('Semestre en cours');
    expect(texte).toContain('ALG1');
    expect(texte).toContain('Algorithmique');
    expect(texte).toContain('Bases de données');
  });

  it('cumule crédits et volume horaire des UE affichées', async () => {
    const wrapper = await monter();
    const texte = texteNormalise(wrapper);

    expect(texte).toContain('Unités rattachées 2');
    expect(texte).toContain('Total crédits 10 ECTS');
    expect(texte).toContain('Volume horaire 80 h');
  });

  it('propose toutes les classes, pas seulement celles déjà pourvues', async () => {
    const wrapper = await monter();
    const options = wrapper.find('#classe-ue-select').findAll('option');

    // `v_semestre_configurations` ne connaît que `c1` : borner le sélecteur à
    // ses lignes interdirait de rattacher la première UE de `c2`.
    expect(options).toHaveLength(2);
    expect(options[1].text()).toContain('ELEC-L1');
    expect(options[1].text()).toContain('aucune UE');
  });

  it('recharge les UE quand la classe change, et le dit quand il n’y en a pas', async () => {
    const wrapper = await monter();

    await wrapper.find('#classe-ue-select').setValue('c2');
    await flushPromises();

    expect(moduleApi.getUesByConfiguration).toHaveBeenCalledWith('s2', 'c2');
    expect(wrapper.text()).toContain("Aucune unité d'enseignement");
    expect(texteNormalise(wrapper)).toContain("Aucun module n'est rattaché à ELEC-L1");
  });

  it("le dit aussi quand l'année active ne porte aucun semestre", async () => {
    vi.spyOn(semestreApi, 'getActiveSemestres').mockResolvedValue({ success: true, data: [] });
    vi.spyOn(classeApi.classesResource, 'list').mockResolvedValue(CLASSES);
    vi.spyOn(moduleApi, 'getSemestresConfiguration').mockResolvedValue({ success: true, data: [] });
    const ues = vi.spyOn(moduleApi, 'getUesByConfiguration');

    const wrapper = mount(UesSemestreTab);
    await flushPromises();

    expect(wrapper.text()).toContain("Aucun semestre sur l'année active");
    // Les deux identifiants sont obligatoires côté serveur (400 sinon).
    expect(ues).not.toHaveBeenCalled();
  });
});
