// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as semestreApi from '../../api';
import * as anneeApi from '../../../annee/api';
import StatistiquesTab from './StatistiquesTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const ANNEES = {
  success: true,
  data: [
    { id: 'a1', code: '2024-2025', statut: 'CLOTUREE', est_active: false },
    { id: 'a2', code: '2025-2026', statut: 'OUVERTE', est_active: true },
    { id: 'a3', code: '2026-2027', statut: 'PLANIFIEE', est_active: false },
  ],
};

/** 12 lignes : de quoi vérifier que le tableau se pagine. */
const matriceDe = (annee) => ({
  success: true,
  data: Array.from({ length: 12 }, (_, index) => ({
    semestre_id: index % 2 === 0 ? 's1' : 's2',
    semestre_code: index % 2 === 0 ? 'S1' : 'S2',
    filiere: `Filière ${index + 1} ${annee}`,
    niveau: 'L1',
    nb_ues: 5,
    total_heures: index === 0 ? 100 : 675,
    // Valeur tirée d'un RANDOM() côté serveur : l'écran ne doit pas l'afficher.
    moyenne_generale: '13.79',
    statut_maquette: index === 0 ? 'Heures < Minimum' : 'Conforme',
  })),
});

const REPONSE = (annee) => ({
  success: true,
  data: {
    kpis: {
      volume_horaire_global: 60750,
      corps_enseignant_total: 446,
      total_ues: 450,
      // Constante écrite en dur dans la fonction SQL.
      taux_assiduite_global: '92.4',
    },
    matrix: matriceDe(annee).data,
    typology: [{ volume_heures: 60750, pourcentage: '100.0' }],
  },
});

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('onglet Statistiques des semestres', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async () => {
    vi.spyOn(anneeApi.anneesResource, 'list').mockResolvedValue(ANNEES);
    vi.spyOn(semestreApi, 'getSemestreAnalytics').mockImplementation((periode) =>
      Promise.resolve(REPONSE(periode))
    );

    const wrapper = mount(StatistiquesTab);
    await flushPromises();
    return wrapper;
  };

  it('propose toutes les années de la base et s’ouvre sur l’année active', async () => {
    const wrapper = await monter();

    const options = wrapper.findAll('#annee-analytique option').map((option) => option.text());
    expect(options).toEqual(['2026-2027', '2025-2026 (en cours)', '2024-2025']);
    expect(semestreApi.getSemestreAnalytics).toHaveBeenCalledWith('2025-2026');
  });

  it('recharge la période quand on choisit une année antérieure', async () => {
    const wrapper = await monter();

    await wrapper.find('#annee-analytique').setValue('2024-2025');
    await flushPromises();

    expect(semestreApi.getSemestreAnalytics).toHaveBeenLastCalledWith('2024-2025');
    expect(texteNormalise(wrapper)).toContain('Filière 1 2024-2025');
  });

  it('pagine la charge d’enseignement au lieu de tout déverser', async () => {
    const wrapper = await monter();

    expect(wrapper.findAll('tbody tr')).toHaveLength(10);
    expect(texteNormalise(wrapper)).toContain('Affichage de 1 à 10 sur 12 résultats');
  });

  it('filtre la charge par semestre et revient en première page', async () => {
    const wrapper = await monter();

    await wrapper.find('.form-select-sm').setValue('S2');
    await flushPromises();

    const lignes = wrapper.findAll('tbody tr');
    expect(lignes).toHaveLength(6);
    expect(lignes.every((ligne) => ligne.text().includes('S2'))).toBe(true);
  });

  it('n’affiche aucune des trois valeurs fabriquées par le serveur', async () => {
    const texte = texteNormalise(await monter());

    // Assiduité constante, moyenne aléatoire, typologie à une seule ligne.
    expect(texte).not.toContain('Assiduité');
    expect(texte).not.toContain('92.4');
    expect(texte).not.toContain('13.79');
    expect(texte).not.toContain('/20');
    expect(texte).not.toContain('Volume Groupe');
    // Ce qui les remplace est, lui, déduit de la matrice.
    expect(texte).toContain('Maquettes conformes 11 / 12');
    expect(texte).toContain('Répartition du volume horaire');
  });

  it('signale une période sans donnée plutôt qu’un écran vide', async () => {
    vi.spyOn(anneeApi.anneesResource, 'list').mockResolvedValue(ANNEES);
    vi.spyOn(semestreApi, 'getSemestreAnalytics').mockResolvedValue({
      success: true,
      data: { kpis: {}, matrix: [], typology: [] },
    });

    const wrapper = mount(StatistiquesTab);
    await flushPromises();

    expect(texteNormalise(wrapper)).toContain('Aucune donnée pour 2025-2026');
  });
});
