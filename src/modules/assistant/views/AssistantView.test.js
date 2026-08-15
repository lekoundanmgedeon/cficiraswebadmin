import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('../api', () => ({
  poserQuestion: vi.fn(),
  getSante: vi.fn(),
  getCatalogue: vi.fn(),
  getConversations: vi.fn(() => Promise.resolve({ data: [] })),
  getConversation: vi.fn(),
  patchConversation: vi.fn(),
  getHistorique: vi.fn(),
  getAudit: vi.fn(),
  getAuditStatistiques: vi.fn(),
}));

vi.mock('@/shared/stores/notificationStore', () => ({
  useNotificationStore: () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
    notifyWarning: vi.fn(),
  }),
}));

import { useAuthStore } from '@/core/auth/authStore';
import { getCatalogue, getSante, poserQuestion } from '../api';
import AssistantView from './AssistantView.vue';

/**
 * L'écran refondu tient sur deux états et une règle.
 *
 * Les deux états : la barre d'appel avec ses aperçus à l'arrivée, le fil seul
 * dès la première réponse. La règle : les aperçus proposés viennent du
 * catalogue **du rôle**, jamais d'une liste écrite en dur.
 */

const CATALOGUE_ADMIN = {
  data: {
    role: 'ADMIN',
    nbVues: 20,
    domaines: ['academique', 'concours', 'evaluations', 'finances', 'pedagogie'],
    vues: [
      {
        nom: 'v_organisation_classes',
        domaine: 'academique',
        description: 'Une ligne par classe.',
        nbColonnes: 10,
      },
      {
        nom: 'v_finance_kpi',
        domaine: 'finances',
        description: 'Indicateurs financiers.',
        nbColonnes: 7,
      },
    ],
  },
};

const monter = async () => {
  const wrapper = mount(AssistantView, {
    global: { stubs: { PageHeader: { template: '<div><slot name="actions" /></div>' } } },
  });
  await new Promise((r) => setTimeout(r));
  await wrapper.vm.$nextTick();
  return wrapper;
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  getSante.mockResolvedValue({
    data: { disponible: true, sources: { nbVues: 20, domaines: ['academique'] } },
  });
  getCatalogue.mockResolvedValue(CATALOGUE_ADMIN);
  vi.spyOn(useAuthStore(), 'fetchCurrentUser').mockResolvedValue(null);
});

describe('Au montage', () => {
  it('ne lance que les deux appels bon marché, jamais de question', async () => {
    // Une question mobilise un modèle et plusieurs requêtes SQL ; `/sante` et
    // `/catalogue` n'en sollicitent aucun.
    await monter();

    expect(getSante).toHaveBeenCalledTimes(1);
    expect(getCatalogue).toHaveBeenCalledTimes(1);
    expect(poserQuestion).not.toHaveBeenCalled();
  });
});

describe('Les aperçus suivent le catalogue du rôle', () => {
  it('propose les tuiles financières à qui a des sources financières', async () => {
    const wrapper = await monter();

    expect(wrapper.text()).toContain('Finances');
    expect(wrapper.text()).toContain('Impayés par classe');
  });

  it('n’en propose aucune à qui n’en a pas', async () => {
    // Le garde SQL refuserait la lecture : la tuile serait un bouton qui ment.
    getCatalogue.mockResolvedValue({
      data: { role: 'PEDAGOGIE', nbVues: 3, domaines: ['pedagogie'], vues: [] },
    });

    const wrapper = await monter();

    expect(wrapper.text()).toContain('Pédagogie');
    expect(wrapper.text()).not.toContain('Impayés par classe');
  });

  it('pose la question de la tuile, sans cadrage', async () => {
    // L'écran de plateforme n'est l'écran d'aucun domaine : le cadrage reste
    // `null`, contrairement aux quatre onglets métier.
    poserQuestion.mockResolvedValue({
      data: { conversationId: 'fil-1', reponse: 'Réponse.', aboutie: true, requetes: [] },
    });

    const wrapper = await monter();
    const tuile = wrapper
      .findAll('.apercus-item')
      .find((b) => b.text().includes('Effectifs par filière'));

    await tuile.trigger('click');

    expect(poserQuestion).toHaveBeenCalledWith(
      "Combien d'étudiants par filière cette année ?",
      null,
      null
    );
  });
});

describe('Les deux états de l’écran', () => {
  it('efface la barre d’appel et les aperçus dès la première réponse', async () => {
    // Une réponse porte souvent un tableau de quatre colonnes : c'est la
    // largeur qui lui manque, jamais la hauteur.
    poserQuestion.mockResolvedValue({
      data: {
        conversationId: 'fil-1',
        reponse: 'Il y a 893 étudiants.',
        aboutie: true,
        requetes: [],
      },
    });

    const wrapper = await monter();
    expect(wrapper.find('.apercus-item').exists()).toBe(true);

    await wrapper.findAll('.apercus-item')[0].trigger('click');
    await new Promise((r) => setTimeout(r));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.apercus-item').exists()).toBe(false);
    expect(wrapper.find('.assistant-appel').exists()).toBe(false);
    expect(wrapper.text()).toContain('Il y a 893 étudiants.');
  });
});

describe('Les sources restent affichées dans les deux états', () => {
  it('annonce le périmètre sans déplier le détail', async () => {
    const wrapper = await monter();

    expect(wrapper.text()).toContain("Les 20 sources que votre rôle permet d'interroger");
    // Repliée : vingt vues avec leurs descriptions occuperaient un écran entier.
    expect(wrapper.text()).not.toContain('v_organisation_classes');
  });

  it('déplie les vues nommées, groupées par domaine', async () => {
    const wrapper = await monter();
    await wrapper.find('.sources-entete').trigger('click');

    expect(wrapper.text()).toContain('v_organisation_classes');
    expect(wrapper.text()).toContain('Une ligne par classe.');
  });
});

describe('Quand l’assistant est hors service', () => {
  it('désactive les aperçus plutôt que de les laisser cliquables', async () => {
    getSante.mockResolvedValue({
      data: { disponible: false, modele: { fournisseur: 'groq', joignable: false }, sources: null },
    });

    const wrapper = await monter();

    expect(wrapper.text()).toContain('Assistant indisponible');
    expect(wrapper.find('.apercus-item').attributes('disabled')).toBeDefined();
  });
});
