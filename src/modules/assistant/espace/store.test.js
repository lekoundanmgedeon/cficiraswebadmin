import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('../api', () => ({
  poserQuestion: vi.fn(),
  getConversation: vi.fn(),
  getConversations: vi.fn(() => Promise.resolve({ data: [] })),
  patchConversation: vi.fn(),
  getSante: vi.fn(),
  getCatalogue: vi.fn(),
}));

vi.mock('@/shared/stores/notificationStore', () => ({
  useNotificationStore: () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
    notifyWarning: vi.fn(),
  }),
}));

import { getConversation, getConversations, patchConversation, poserQuestion } from '../api';
import { useEspaceChatStore } from './store';

/** Le fil que rend `GET /conversations/:id`. */
const fil = (surcharge = {}) => ({
  data: {
    conversationId: 'fil-1',
    titre: 'Combien d’étudiants ?',
    archivee: false,
    cadrage: 'finances',
    echanges: [
      {
        id: 'e1',
        question: 'Combien d’étudiants ?',
        reponse: 'Il y a 893 étudiants.',
        aboutie: true,
        erreur: null,
        cadrage: 'finances',
        dureeMs: 1500,
        requetes: [{ intention: 'compter', sql: 'SELECT …', nbLignes: 1 }],
        horodatage: '2026-08-02T09:12:00.000Z',
      },
    ],
    ...surcharge,
  },
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  getConversations.mockResolvedValue({ data: [] });
});

describe('Rouvrir une conversation', () => {
  it('déplie chaque échange en deux messages, question puis réponse', async () => {
    // La base range un échange sur une ligne ; le fil, lui, s'affiche en deux
    // bulles. Sans ce dépliage, la réponse apparaîtrait sans sa question.
    const store = useEspaceChatStore();
    getConversation.mockResolvedValue(fil());

    await store.chargerConversation('fil-1');

    expect(store.messages).toHaveLength(2);
    expect(store.messages[0]).toMatchObject({ role: 'user', texte: 'Combien d’étudiants ?' });
    expect(store.messages[1]).toMatchObject({ role: 'assistant', texte: 'Il y a 893 étudiants.' });
  });

  it('marque les messages rejoués comme archivés, avec leur date d’origine', async () => {
    // C'est ce qui permet à l'écran d'annoncer « chiffres arrêtés au … ». Sans
    // ce marquage, une réponse d'il y a trois semaines se lirait comme un
    // effectif encore valable.
    const store = useEspaceChatStore();
    getConversation.mockResolvedValue(fil());

    await store.chargerConversation('fil-1');

    expect(store.messages.every((m) => m.archive)).toBe(true);
    expect(store.messages[1].horodatage).toBe('2026-08-02T09:12:00.000Z');
    expect(store.estRelecture).toBe(true);
  });

  it('affiche l’erreur d’un échange non abouti plutôt qu’une bulle vide', async () => {
    const store = useEspaceChatStore();
    getConversation.mockResolvedValue(
      fil({
        echanges: [
          {
            id: 'e1',
            question: 'Et par filière ?',
            reponse: null,
            aboutie: false,
            erreur: 'Le budget par minute est saturé.',
            horodatage: '2026-08-02T09:15:00.000Z',
          },
        ],
      })
    );

    await store.chargerConversation('fil-1');

    expect(store.messages[1].texte).toBe('Le budget par minute est saturé.');
    expect(store.messages[1].aboutie).toBe(false);
  });

  it('reprend le cadrage du fil, pour que la question suivante s’y comprenne', async () => {
    const store = useEspaceChatStore();
    getConversation.mockResolvedValue(fil());

    await store.chargerConversation('fil-1');

    expect(store.cadrage).toBe('finances');
  });
});

describe('Poser une question dans l’espace', () => {
  const reponse = {
    data: {
      conversationId: 'fil-9',
      reponse: 'Il y a 893 étudiants.',
      aboutie: true,
      requetes: [],
      dureeMs: 1200,
    },
  };

  it('ne rafraîchit la liste qu’à l’ouverture d’un fil', async () => {
    // Les questions suivantes ne changent qu'un compteur : un aller-retour par
    // réponse est un coût inutile sur un écran déjà lent.
    const store = useEspaceChatStore();
    poserQuestion.mockResolvedValue(reponse);

    await store.demander('Combien d’étudiants ?');
    expect(getConversations).toHaveBeenCalledTimes(1);

    await store.demander('Et par filière ?');
    expect(getConversations).toHaveBeenCalledTimes(1);
  });

  it('transmet le cadrage choisi au serveur', async () => {
    const store = useEspaceChatStore();
    store.nouvelleConversation('examens');
    poserQuestion.mockResolvedValue(reponse);

    await store.demander('Le taux de réussite ?');

    expect(poserQuestion).toHaveBeenCalledWith('Le taux de réussite ?', null, 'examens');
  });
});

describe('Ranger une conversation', () => {
  it('archive sans supprimer, et recharge la liste', async () => {
    const store = useEspaceChatStore();
    store.conversationId = 'fil-1';
    patchConversation.mockResolvedValue({ data: { archivee: true } });

    await store.archiver('fil-1', true);

    expect(patchConversation).toHaveBeenCalledWith('fil-1', { archivee: true });
    expect(store.archivee).toBe(true);
    expect(getConversations).toHaveBeenCalled();
  });

  it('relit le titre dans la liste après un renommage annulé', async () => {
    // `PATCH { titre: null }` rend `titre: null` ; le fil, lui, retrouve pour
    // titre sa première question — que seule la liste calcule.
    const store = useEspaceChatStore();
    store.conversationId = 'fil-1';
    store.titre = 'Un titre choisi';
    patchConversation.mockResolvedValue({ data: { titre: null } });
    getConversations.mockResolvedValue({
      data: [{ conversation_id: 'fil-1', titre: 'Combien d’étudiants ?' }],
    });

    await store.renommer('fil-1', null);

    expect(store.titre).toBe('Combien d’étudiants ?');
  });
});

describe('Le fil exportable', () => {
  it('recompose les échanges à partir des bulles affichées', async () => {
    const store = useEspaceChatStore();
    getConversation.mockResolvedValue(fil());

    await store.chargerConversation('fil-1');

    expect(store.filExportable.echanges).toEqual([
      expect.objectContaining({
        question: 'Combien d’étudiants ?',
        reponse: 'Il y a 893 étudiants.',
        aboutie: true,
      }),
    ]);
  });
});
