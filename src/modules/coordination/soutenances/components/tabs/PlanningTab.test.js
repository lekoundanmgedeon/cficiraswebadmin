// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as api from '../../api';
import PlanningTab from './PlanningTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Une session de soutenances tient couramment sur **une seule journée** — 208
 * sur le même jour dans le jeu de démonstration. C'est ce qui interdit de
 * paginer par journée : le découpage porte sur les séances, et le regroupement
 * sur la page affichée.
 */
const seance = (index, jour = '2026-06-15') => ({
  id: `s${index}`,
  date_soutenance: `${jour}T00:00:00.000Z`,
  heure_debut: `${String(8 + Math.floor(index / 4)).padStart(2, '0')}:00:00`,
  heure_fin: `${String(9 + Math.floor(index / 4)).padStart(2, '0')}:00:00`,
  nom: `ETUDIANT${index}`,
  prenom: 'Test',
  matricule: `ETU-${index}`,
  theme: `Thème ${index}`,
  filiere: 'Informatique',
  code_salle: 'A1',
  nb_jurys: 3,
  statut: 'PLANIFIEE',
  pv_numero: null,
});

const SOUTENANCES = {
  success: true,
  // 25 séances le même jour, plus une la veille : deux pages de 20.
  data: [...Array.from({ length: 25 }, (_, i) => seance(i)), seance(99, '2026-06-14')],
};

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('planning des soutenances', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async () => {
    vi.spyOn(api.soutenancesResource, 'list').mockResolvedValue(SOUTENANCES);
    vi.spyOn(api, 'getStatistiquesSoutenances').mockResolvedValue({ success: true, data: null });

    const wrapper = mount(PlanningTab);
    await flushPromises();
    return wrapper;
  };

  it('pagine les séances, et non les journées', async () => {
    const wrapper = await monter();

    expect(wrapper.findAll('tbody tr')).toHaveLength(20);
    expect(texteNormalise(wrapper)).toContain('Affichage de 1 à 20 sur 26 résultats');
  });

  it('dit combien de séances d’une journée sont visibles sur son total', async () => {
    const texte = texteNormalise(await monter());

    // La journée compte 25 séances ; 20 seulement tiennent sur la page.
    expect(texte).toContain('20 soutenance(s) affichée(s) sur 25');
  });

  it('regroupe la page affichée, sans couper une journée sans suite', async () => {
    const wrapper = await monter();

    const boutonPage2 = wrapper
      .findAll('.pagination .page-link')
      .find((lien) => lien.text() === '2');
    await boutonPage2.trigger('click');
    await flushPromises();

    // Page 2 : le reste de la journée du 15, puis la journée du 14.
    expect(wrapper.findAll('tbody tr')).toHaveLength(6);
    expect(wrapper.findAll('tbody')).toHaveLength(2); // deux journées, deux tableaux
  });
});
