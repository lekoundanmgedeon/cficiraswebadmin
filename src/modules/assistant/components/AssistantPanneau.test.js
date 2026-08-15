import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('../api', () => ({
  poserQuestion: vi.fn(),
  getConversations: vi.fn(() => Promise.resolve({ data: [] })),
  getSante: vi.fn(() => Promise.resolve({ data: { disponible: true, sources: { nbVues: 22 } } })),
  getCatalogue: vi.fn(),
  getHistorique: vi.fn(),
}));

vi.mock('@/shared/stores/notificationStore', () => ({
  useNotificationStore: () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }),
}));

import { useAuthStore } from '@/core/auth/authStore';
import { getSante, poserQuestion } from '../api';
import AssistantPanneau from './AssistantPanneau.vue';

/**
 * Le panneau est monté par les quatre onglets. Ce qui doit tenir : qu'il pose
 * ses questions **sous le cadrage de son écran** — un cadrage perdu en route
 * donnerait un assistant qui répond hors sujet sans que rien ne le signale —,
 * et qu'il ne lance aucune question au montage : une question mobilise un
 * modèle et plusieurs requêtes SQL.
 */

const monter = (cadrage = 'examens') =>
  mount(AssistantPanneau, {
    props: {
      cadrage,
      titre: 'Assistant',
      intro: 'Une intro.',
      amorces: [
        { icone: 'bi-bar-chart-steps', libelle: 'Comparer', question: 'Compare les classes.' },
      ],
    },
  });

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  getSante.mockResolvedValue({ data: { disponible: true, sources: { nbVues: 22 } } });
  // Le panneau charge le profil au montage — c'est lui qui décide de
  // l'affichage du SQL. Rien à vérifier ici : on évite seulement l'appel réel.
  vi.spyOn(useAuthStore(), 'fetchCurrentUser').mockResolvedValue(null);
});

describe('AssistantPanneau', () => {
  it('ne pose aucune question au montage, seulement le diagnostic', async () => {
    monter();
    await Promise.resolve();

    expect(getSante).toHaveBeenCalledTimes(1);
    expect(poserQuestion).not.toHaveBeenCalled();
  });

  it('pose la question d’une amorce sous le cadrage de l’écran', async () => {
    poserQuestion.mockResolvedValue({
      data: { conversationId: 'fil-1', reponse: 'Réponse.', aboutie: true, requetes: [] },
    });

    const wrapper = monter('examens');
    await wrapper.find('.assistant-amorce').trigger('click');

    expect(poserQuestion).toHaveBeenCalledWith('Compare les classes.', null, 'examens');
  });

  it('affiche la cause quand l’assistant est hors service', async () => {
    getSante.mockResolvedValue({
      data: {
        disponible: false,
        modele: { fournisseur: 'groq', joignable: false },
        sources: null,
      },
    });

    const wrapper = monter('scolarite');
    await new Promise((r) => setTimeout(r));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Assistant indisponible');
    expect(wrapper.text()).toContain('groq');
    // Une amorce cliquable alors que rien ne répondra serait un bouton qui ment.
    expect(wrapper.find('.assistant-amorce').attributes('disabled')).toBeDefined();
  });
});
