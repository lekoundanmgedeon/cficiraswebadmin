// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import Pagination from '@/components/shared/Pagination.vue';
import AssignationsContent from './attributions/components/tabs/AssignationsContent.vue';
import CreneauxHoraires from './crenaux/components/tabs/CreneauxHoraires.vue';
import ProgrammeCours from './programme/components/tabs/ProgrammeCours.vue';
import CreditsAcademiques from './programme/components/tabs/CreditsAcademiques.vue';
import { useAttributionStore } from './attributions/store';
import { useScheduleStore } from './crenaux/store';
import { useMaquetteStore } from './programme/store';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Pagination des onglets d'« Affaires pédagogiques ».
 *
 * Ces quatre tableaux posaient **toutes** leurs lignes dans le DOM. Sur le jeu
 * de démonstration, mesuré contre `localhost:3500` : 4 050 attributions
 * (`vue_attributions_cours`), 1 351 créneaux (`vue_horaire_details`), 1 350
 * lignes de maquette et 450 modules.
 *
 * Trois pièges sont verrouillés ici, parce que ce sont ceux qui se voient mal :
 *
 * 1. **`:total-items` doit recevoir le total filtré, pas la page.** Le lui
 *    passer la tranche donnerait une pagination à une seule page — le tableau
 *    serait tronqué sans que rien ne permette d'atteindre la suite.
 * 2. **Le sélecteur « Afficher N » doit être lié dans les deux sens.** Avec un
 *    simple `:items-per-page`, l'émission de `Pagination.vue` ne trouve pas
 *    d'écouteur : le menu change d'apparence et le tableau ne bouge pas. C'est
 *    le défaut trouvé dans l'onglet des formateurs, seul déjà paginé.
 * 3. **Un changement de filtre doit ramener en page 1.** Filtrer depuis la
 *    page 40 laisse sinon devant un tableau vide.
 */

/** Empêche les `onMounted` d'aller au réseau, sans mocker six modules d'API. */
function neutraliserAppels(store, actions) {
  for (const action of actions) vi.spyOn(store, action).mockResolvedValue(undefined);
}

const lignes = (wrapper) => wrapper.findAll('tbody tr');

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('Assignation des enseignements', () => {
  /** @param {number} n */
  // La classe porte l'indice : c'est la seule colonne que le tableau rend sans
  // passer par un référentiel, et il en faut une qui distingue les lignes pour
  // vérifier qu'on change bien de tranche.
  const assignations = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: `a${i}`,
      classe: `CL-${i}`,
      matiereId: `m${i}`,
      formateurId: `f${i}`,
      heures: 30,
    }));

  async function monter(nb = 120) {
    const store = useAttributionStore();
    neutraliserAppels(store, ['fetchAssignments', 'fetchReferentiels']);
    store.assignments = assignations(nb);

    const wrapper = mount(AssignationsContent);
    await flushPromises();
    return { wrapper, store };
  }

  it('n’affiche qu’une page, pas les 120 lignes', async () => {
    const { wrapper } = await monter(120);

    expect(lignes(wrapper)).toHaveLength(10);
  });

  it('annonce le total filtré à la barre de pagination', async () => {
    // Lui passer la tranche donnerait « 1 page sur 1 » : le reste du tableau
    // deviendrait inatteignable.
    const { wrapper } = await monter(120);

    expect(wrapper.findComponent(Pagination).props('totalItems')).toBe(120);
  });

  it('rend la tranche suivante au changement de page', async () => {
    const { wrapper } = await monter(120);
    expect(lignes(wrapper)[0].text()).toContain('CL-0');

    await wrapper.findComponent(Pagination).vm.$emit('update:modelValue', 2);
    await flushPromises();

    expect(lignes(wrapper)[0].text()).toContain('CL-10');
  });

  it('agrandit réellement la page quand on change « Afficher N »', async () => {
    const { wrapper } = await monter(120);

    await wrapper.findComponent(Pagination).vm.$emit('update:itemsPerPage', 30);
    await flushPromises();

    expect(lignes(wrapper)).toHaveLength(30);
  });
});

describe('Créneaux horaires', () => {
  const creneaux = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: `c${i}`,
      date: '2026-03-02',
      heureDebut: '08:00',
      heureFin: '10:00',
      classe: i < 15 ? 'GI-L1' : 'GC-L2',
      matiere: 'Algorithmique',
      salle: '101',
      formateur: 'A. MBEMBA',
    }));

  async function monter(nb = 60) {
    const store = useScheduleStore();
    neutraliserAppels(store, ['fetchSchedules', 'fetchReferentiels']);
    store.schedules = creneaux(nb);

    const wrapper = mount(CreneauxHoraires);
    await flushPromises();
    return { wrapper, store };
  }

  it('n’affiche qu’une page des 60 séances', async () => {
    const { wrapper } = await monter(60);

    expect(lignes(wrapper)).toHaveLength(10);
    expect(wrapper.findComponent(Pagination).props('totalItems')).toBe(60);
  });

  it('revient en page 1 quand on filtre par classe', async () => {
    // 15 séances pour « GI-L1 » : rester en page 5 n'afficherait rien.
    const { wrapper } = await monter(60);

    await wrapper.findComponent(Pagination).vm.$emit('update:modelValue', 5);
    await flushPromises();

    wrapper.vm.tableFilterClasse = 'GI-L1';
    await flushPromises();

    expect(wrapper.findComponent(Pagination).props('modelValue')).toBe(1);
    expect(wrapper.findComponent(Pagination).props('totalItems')).toBe(15);
  });
});

describe('Maquette pédagogique', () => {
  const regles = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: `r${i}`,
      classe: 'GI-L1',
      semestre: 'S1',
      moduleCode: `UE${i}`,
      matiere: `Matière ${i}`,
      coefficient: 2,
      ects: 4,
      noteEliminatoire: 6,
    }));

  it('n’affiche qu’une page des 80 règles', async () => {
    const store = useMaquetteStore();
    neutraliserAppels(store, ['fetchMaquette', 'fetchReferentiels']);
    store.rules = regles(80);

    const wrapper = mount(ProgrammeCours);
    await flushPromises();

    expect(lignes(wrapper)).toHaveLength(10);
    expect(wrapper.findComponent(Pagination).props('totalItems')).toBe(80);
  });
});

describe('Répartition des UE', () => {
  it('n’affiche qu’une page des 90 modules', async () => {
    const store = useMaquetteStore();
    neutraliserAppels(store, ['fetchReferentiels']);
    store.ueDistribution = Array.from({ length: 90 }, (_, i) => ({
      code: `UE${i}`,
      nom: `Module ${i}`,
      heures: 30,
      ects: 4,
      obligatoire: true,
    }));

    const wrapper = mount(CreditsAcademiques);
    await flushPromises();

    expect(lignes(wrapper)).toHaveLength(10);
    expect(wrapper.findComponent(Pagination).props('totalItems')).toBe(90);
  });
});
