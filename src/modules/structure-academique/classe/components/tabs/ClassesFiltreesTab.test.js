// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as classeApi from '../../api';
import * as filiereApi from '../../../filiere/api';
import * as niveauApi from '../../../niveau/api';
import ClassesFiltreesTab from './ClassesFiltreesTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/** Charge utile de `v_classes_effectifs` — la seule à porter les effectifs. */
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
      code: 'GI-L2',
      capacite_max: 30,
      niveau_id: 'n2',
      filiere_id: 'f1',
      niveau_code: 'L2',
      filiere_nom: 'Génie Informatique',
      nb_etudiants: 0,
    },
    {
      id: 'c3',
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

const FILIERES = {
  success: true,
  data: [
    { id: 'f1', code: 'GI', designation: 'Génie Informatique', cycle_nom: 'Licence' },
    { id: 'f2', code: 'ELEC', designation: 'Electricite', cycle_nom: 'Licence' },
  ],
};

/** Un niveau n'a pas de désignation en base : `code` et `ordre`, rien de plus. */
const NIVEAUX = {
  success: true,
  data: [
    { id: 'n1', code: 'L1', ordre: 1, cycle_code: 'LMD-L', nb_classes: 2 },
    { id: 'n2', code: 'L2', ordre: 2, cycle_code: 'LMD-L', nb_classes: 1 },
  ],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglets « Par filière » et « Par niveau » des classes', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const monter = async (dimension) => {
    vi.spyOn(classeApi.classesResource, 'list').mockResolvedValue(CLASSES);
    vi.spyOn(filiereApi.filieresResource, 'list').mockResolvedValue(FILIERES);
    vi.spyOn(niveauApi.niveauxResource, 'list').mockResolvedValue(NIVEAUX);

    const wrapper = mount(ClassesFiltreesTab, { props: { dimension } });
    await flushPromises();
    return wrapper;
  };

  it('ne montre que les classes de la filière choisie', async () => {
    const wrapper = await monter('filiere');
    const texte = texteNormalise(wrapper);

    expect(texte).toContain('GI-L1');
    expect(texte).toContain('GI-L2');
    expect(texte).not.toContain('ELEC-L1');

    // Totaux de la sélection : 9 inscrits pour 60 places.
    expect(texte).toContain('2 classe(s)');
    expect(texte).toContain('9 inscrit(s)');
    expect(texte).toContain('51 place(s) libre(s) sur 60');
    expect(texte).toContain('remplissage 15.0 %');
  });

  it('change de sélection sans repasser par le réseau', async () => {
    const wrapper = await monter('filiere');
    const appels = classeApi.classesResource.list.mock.calls.length;

    await wrapper.find('#dimension-select').setValue('f2');

    const texte = texteNormalise(wrapper);
    expect(texte).toContain('ELEC-L1');
    expect(texte).not.toContain('GI-L1');
    expect(classeApi.classesResource.list.mock.calls.length).toBe(appels);
  });

  it('ne passe pas par les routes qui perdent les effectifs', async () => {
    const parFiliere = vi.spyOn(classeApi, 'getClassesByFiliere');
    const parNiveau = vi.spyOn(classeApi, 'getClassesByNiveau');

    await monter('filiere');

    // `v_classes_par_filiere` n'est que `classe.*` : s'en servir afficherait un
    // effectif de 0 partout, et écraserait en prime la liste du premier onglet.
    expect(parFiliere).not.toHaveBeenCalled();
    expect(parNiveau).not.toHaveBeenCalled();
  });

  it('filtre par niveau, et montre alors la filière de chaque classe', async () => {
    const wrapper = await monter('niveau');
    const texte = texteNormalise(wrapper);

    // Le niveau L1 porte une classe de chaque filière.
    expect(texte).toContain('GI-L1');
    expect(texte).toContain('ELEC-L1');
    expect(texte).not.toContain('GI-L2');
    expect(texte).toContain('Génie Informatique');
    expect(texte).toContain('Electricite');
    expect(texte).toContain('14 inscrit(s)');
  });

  it('reste lisible quand la sélection ne porte aucune classe', async () => {
    vi.spyOn(classeApi.classesResource, 'list').mockResolvedValue({ success: true, data: [] });
    vi.spyOn(filiereApi.filieresResource, 'list').mockResolvedValue(FILIERES);

    const wrapper = mount(ClassesFiltreesTab, { props: { dimension: 'filiere' } });
    await flushPromises();

    expect(wrapper.text()).toContain('Aucune classe pour Génie Informatique');
    expect(wrapper.text()).not.toContain('NaN');
  });
});
