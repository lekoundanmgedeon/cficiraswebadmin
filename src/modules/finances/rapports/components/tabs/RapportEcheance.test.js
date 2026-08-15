// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as api from '@/modules/finances/api';
import RapportEcheance from './RapportEcheance.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const PLANS = {
  success: true,
  data: [
    {
      id: 'p1',
      code: 'ANNUEL',
      nom: 'Paiement annuel',
      description: 'La totalité du dû est réglée en une fois.',
      periodicite: 'ANNUEL',
      assiette: 'TOTAL',
      nombre_traites: 1,
      jour_echeance: 5,
      actif: true,
      classes_associees: 'ING-GC-L1-A, ING-GC-L1-B, ING-GC-L2-A',
    },
  ],
};

/**
 * Charge utile réelle de `GET /finance/echeanciers/suivi` : `pg` sert les
 * montants et `total_traites` en **chaînes**.
 */
const traite = (index, surcharge = {}) => ({
  id: `t${index}`,
  matricule: `ETU-2024-${String(index).padStart(4, '0')}`,
  etudiant: `Étudiant ${index}`,
  classe_code: 'MR-IA-M2-B',
  filiere: index % 2 === 0 ? 'Intelligence Artificielle' : 'Génie Civil',
  plan: 'Plan executive 2 tranches (50/50)',
  numero: 1,
  total_traites: '2',
  libelle: "À l'inscription",
  montant: '455000.00',
  montant_regle: '0.00',
  reste: '455000.00',
  date_echeance_fr: '05/10/2024',
  statut: index === 0 ? 'PAYE' : 'EN_RETARD',
  statut_libelle: index === 0 ? 'Payée' : 'En retard',
  jours_retard: index === 0 ? 0 : 679,
  ...surcharge,
});

const SUIVI = { success: true, data: Array.from({ length: 18 }, (_, index) => traite(index)) };

const texteNormalise = (wrapper) => wrapper.text().replace(/\s+/g, ' ');

describe('rapport — plans d’échelonnement et suivi des traites', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const monter = async () => {
    vi.spyOn(api.plansResource, 'list').mockResolvedValue(PLANS);
    vi.spyOn(api, 'getSuiviTraites').mockResolvedValue(SUIVI);

    const wrapper = mount(RapportEcheance);
    await flushPromises();
    return wrapper;
  };

  it('sert les plans réellement déclarés, et non les trois modèles codés en dur', async () => {
    const texte = texteNormalise(await monter());

    expect(texte).toContain('Paiement annuel');
    expect(texte).toContain('ANNUEL');
    expect(texte).toContain('3 classe(s) rattachée(s)');
    // Les libellés inventés de l'ancienne version.
    expect(texte).not.toContain('Plan Standard Classique');
    expect(texte).not.toContain('Plan Executive Master');
  });

  it('demande le suivi complet, et non les 500 lignes du défaut serveur', async () => {
    await monter();

    expect(api.getSuiviTraites).toHaveBeenCalledWith({ limite: 10000 });
  });

  it('pagine les traites au lieu de toutes les rendre', async () => {
    const wrapper = await monter();

    expect(wrapper.findAll('tbody tr')).toHaveLength(15);
    expect(texteNormalise(wrapper)).toContain('Affichage de 1 à 15 sur 18 résultats');
    expect(texteNormalise(wrapper)).toContain('17 traite(s) en retard sur 18');
  });

  it('filtre sur des valeurs tirées des données, pas sur deux filières écrites en dur', async () => {
    const wrapper = await monter();
    const selects = wrapper.findAll('select');

    const optionsFilieres = selects[1].findAll('option').map((option) => option.text());
    expect(optionsFilieres).toEqual([
      'Toutes les filières',
      'Génie Civil',
      'Intelligence Artificielle',
    ]);

    await selects[1].setValue('Génie Civil');
    await flushPromises();

    const lignes = wrapper.findAll('tbody tr');
    expect(lignes).toHaveLength(9);
    expect(lignes.every((ligne) => ligne.text().includes('Génie Civil'))).toBe(true);
  });

  it('n’offre plus les boutons qui ne faisaient qu’un `alert()`', async () => {
    const texte = texteNormalise(await monter());

    expect(texte).not.toContain('Encaisser');
    expect(texte).not.toContain('Relancer');
    expect(texte).not.toContain('Définir un nouveau Plan');
  });

  it('reste lisible quand aucun échéancier n’a été généré', async () => {
    vi.spyOn(api.plansResource, 'list').mockResolvedValue({ success: true, data: [] });
    vi.spyOn(api, 'getSuiviTraites').mockResolvedValue({ success: true, data: [] });

    const wrapper = mount(RapportEcheance);
    await flushPromises();

    expect(wrapper.text()).toContain('Aucune échéance suivie');
    expect(wrapper.text()).not.toContain('NaN');
  });
});
