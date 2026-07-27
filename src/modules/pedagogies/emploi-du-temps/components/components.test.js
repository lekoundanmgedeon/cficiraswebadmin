// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as api from '../api';
import { useEmploiDuTempsStore } from '../store';
import GrilleJours from './GrilleJours.vue';
import VueParCycle from './VueParCycle.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const CRENEAUX = [
  {
    id: 'c1',
    jour: 'LUNDI',
    heure_debut: '08:00:00',
    heure_fin: '10:00:00',
    type_cours: 'CM',
    classe_code: 'GI-L1',
    filiere: 'Génie Informatique',
    cycle_code: 'LMD-L',
    semestre: 'S1',
    nom_module: 'Algorithmique',
    enseignant: 'Alice MBEMBA',
    enseignant_id: 'e1',
    salle_nom: '101',
  },
  {
    id: 'c2',
    jour: 'MERCREDI',
    heure_debut: '14:00:00',
    heure_fin: '16:00:00',
    type_cours: 'TD',
    classe_code: 'GI-L1',
    filiere: 'Génie Informatique',
    cycle_code: 'LMD-L',
    semestre: 'S1',
    nom_module: 'Algorithmique',
    enseignant: 'Alice MBEMBA',
    enseignant_id: 'e1',
    salle_nom: '101',
  },
];

const monterAvec = async (composant, creneaux = CRENEAUX) => {
  vi.spyOn(api, 'getEmploiDuTempsGeneral').mockResolvedValue(creneaux);
  const store = useEmploiDuTempsStore();
  await store.fetchCreneaux();
  const wrapper = mount(composant);
  await flushPromises();
  return wrapper;
};

describe('composants de l’emploi du temps général', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  describe('GrilleJours', () => {
    it('affiche les créneaux du jour actif, sans les secondes', async () => {
      const wrapper = await monterAvec(GrilleJours);

      const texte = wrapper.text();
      // Lundi est l'onglet ouvert par défaut.
      expect(texte).toContain('08:00 – 10:00');
      expect(texte).not.toContain('08:00:00');
      expect(texte).toContain('Algorithmique');
      expect(texte).toContain('Alice MBEMBA');
      expect(texte).toContain('Cours magistral');
    });

    it('compte les créneaux de chaque jour dans ses onglets', async () => {
      const wrapper = await monterAvec(GrilleJours);

      const onglets = wrapper.findAll('.nav-link');
      expect(onglets).toHaveLength(6);
      expect(onglets[0].text()).toContain('Lundi');
      expect(onglets[0].text()).toContain('1');
      expect(onglets[1].text()).toContain('Mardi');
      expect(onglets[1].text()).toContain('0');
    });

    it('bascule de jour au clic', async () => {
      const wrapper = await monterAvec(GrilleJours);

      expect(wrapper.text()).toContain('Cours magistral');

      // Mercredi porte le TD.
      await wrapper.findAll('.nav-link')[2].trigger('click');
      await flushPromises();

      expect(wrapper.text()).toContain('Travaux dirigés');
      expect(wrapper.text()).toContain('14:00 – 16:00');
    });

    it('explique un jour sans cours plutôt que d’afficher un tableau vide', async () => {
      const wrapper = await monterAvec(GrilleJours);

      await wrapper.findAll('.nav-link')[1].trigger('click'); // Mardi
      await flushPromises();

      expect(wrapper.text()).toContain('Aucun cours le mardi');
    });
  });

  describe('VueParCycle', () => {
    it('imbrique cycle, filière et classe', async () => {
      const wrapper = await monterAvec(VueParCycle);

      const texte = wrapper.text();
      expect(texte).toContain('LMD-L');
      expect(texte).toContain('Génie Informatique');
      expect(texte).toContain('GI-L1');
      expect(texte).toContain('2 créneau(x)');
    });

    it('replie les classes au départ, et les déplie au clic', async () => {
      const wrapper = await monterAvec(VueParCycle);

      // Repliée : le détail des créneaux n'est pas rendu.
      expect(wrapper.find('table').exists()).toBe(false);

      await wrapper.find('button').trigger('click');
      await flushPromises();

      expect(wrapper.find('table').exists()).toBe(true);
      expect(wrapper.text()).toContain('Alice MBEMBA');
    });

    it('annonce un périmètre vide', async () => {
      const wrapper = await monterAvec(VueParCycle, []);

      expect(wrapper.text()).toContain('Aucun créneau sur ce périmètre');
    });
  });
});
