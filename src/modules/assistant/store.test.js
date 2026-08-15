import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('./api', () => ({
  poserQuestion: vi.fn(),
  getConversations: vi.fn(() => Promise.resolve({ data: [] })),
  getSante: vi.fn(),
  getCatalogue: vi.fn(),
  getHistorique: vi.fn(),
}));

vi.mock('@/shared/stores/notificationStore', () => ({
  useNotificationStore: () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }),
}));

import { getConversations, getSante, poserQuestion } from './api';
import { useAssistantStore } from './store';

/** La réponse type de `POST /question`. */
const reponse = (surcharge = {}) => ({
  data: {
    conversationId: 'fil-1',
    question: 'Combien d’étudiants ?',
    reponse: 'Il y a 26 étudiants.',
    aboutie: true,
    requetes: [{ intention: 'compter', sql: 'SELECT COUNT(*) …', nbLignes: 1 }],
    tours: 2,
    dureeMs: 1500,
    ...surcharge,
  },
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  getConversations.mockResolvedValue({ data: [] });
});

describe('Poser une question', () => {
  it('inscrit la question dans le fil avant même la réponse', async () => {
    // Sur une réponse qui prend plusieurs secondes, voir sa propre question
    // s'afficher est le seul signe que la demande est partie.
    const store = useAssistantStore();
    let messagesPendantAppel = 0;
    poserQuestion.mockImplementation(() => {
      messagesPendantAppel = store.messages.length;
      return Promise.resolve(reponse());
    });

    await store.demander('Combien d’étudiants ?');

    expect(messagesPendantAppel).toBe(1);
    expect(store.messages[0]).toMatchObject({ role: 'user', texte: 'Combien d’étudiants ?' });
  });

  it('ajoute la réponse avec ses requêtes vérifiables', async () => {
    const store = useAssistantStore();
    poserQuestion.mockResolvedValue(reponse());

    await store.demander('Combien d’étudiants ?');

    expect(store.messages).toHaveLength(2);
    expect(store.messages[1]).toMatchObject({
      role: 'assistant',
      texte: 'Il y a 26 étudiants.',
      aboutie: true,
    });
    expect(store.messages[1].requetes).toHaveLength(1);
  });

  it('retient l’identifiant du fil pour la question suivante', async () => {
    const store = useAssistantStore();
    poserQuestion.mockResolvedValue(reponse());

    await store.demander('Première question');
    expect(store.conversationId).toBe('fil-1');

    await store.demander('Et ensuite ?');
    expect(poserQuestion).toHaveBeenLastCalledWith('Et ensuite ?', 'fil-1', null);
  });

  it('n’ouvre pas de fil sur la première question', async () => {
    const store = useAssistantStore();
    poserQuestion.mockResolvedValue(reponse());

    await store.demander('Première question');

    expect(poserQuestion).toHaveBeenNthCalledWith(1, 'Première question', null, null);
  });

  it('ignore une question vide ou un envoi pendant qu’un appel court', async () => {
    const store = useAssistantStore();
    poserQuestion.mockResolvedValue(reponse());

    await store.demander('   ');
    expect(poserQuestion).not.toHaveBeenCalled();

    store.enCours = true;
    await store.demander('question valide');
    expect(poserQuestion).not.toHaveBeenCalled();
  });

  it('inscrit l’échec dans le fil plutôt que de laisser la question seule', async () => {
    // Sans cela, la question resterait affichée sans réponse ni explication.
    const store = useAssistantStore();
    poserQuestion.mockRejectedValue(Object.assign(new Error('Quota dépassé'), { status: 429 }));

    await store.demander('Combien d’étudiants ?');

    expect(store.messages).toHaveLength(2);
    expect(store.messages[1]).toMatchObject({ role: 'assistant', aboutie: false });
    expect(store.messages[1].texte).toContain('Quota dépassé');
  });

  it('libère le verrou même quand l’appel échoue', async () => {
    const store = useAssistantStore();
    poserQuestion.mockRejectedValue(new Error('panne'));

    await store.demander('question');

    expect(store.enCours).toBe(false);
  });
});

describe('Disponibilité', () => {
  it('nomme la cause : modèle absent', async () => {
    const store = useAssistantStore();
    getSante.mockResolvedValue({
      data: {
        disponible: false,
        modele: {
          fournisseur: 'ollama',
          modele: 'llama3.1:8b',
          joignable: true,
          modelePresent: false,
        },
        sources: { nbVues: 22 },
      },
    });

    await store.fetchSante();

    expect(store.utilisable).toBe(false);
    expect(store.raisonIndisponible).toContain('llama3.1:8b');
  });

  it('nomme la cause : fournisseur injoignable', async () => {
    const store = useAssistantStore();
    getSante.mockResolvedValue({
      data: {
        disponible: false,
        modele: { fournisseur: 'groq', joignable: false, modelePresent: false },
        sources: null,
      },
    });

    await store.fetchSante();

    expect(store.raisonIndisponible).toContain('groq');
  });

  it('vaut null tant que le diagnostic n’a pas tourné', () => {
    // `false` ferait afficher « indisponible » avant toute vérification.
    expect(useAssistantStore().utilisable).toBeNull();
  });
});

describe('Cadrage par écran', () => {
  it('transmet le cadrage à chaque question', async () => {
    const store = useAssistantStore('structure-academique');
    poserQuestion.mockResolvedValue(reponse());

    await store.demander('Combien de classes ?');

    expect(poserQuestion).toHaveBeenCalledWith(
      'Combien de classes ?',
      null,
      'structure-academique'
    );
  });

  it('donne un fil distinct à chaque écran', async () => {
    // Sans cela, une question posée depuis la délibération apparaîtrait dans
    // l'onglet des semestres, et les deux écrans partageraient une seule
    // conversation côté serveur — chacun héritant du contexte de l'autre.
    const scolarite = useAssistantStore('scolarite');
    const examens = useAssistantStore('examens');
    poserQuestion.mockResolvedValue(reponse());

    await scolarite.demander('Une question de scolarité');

    expect(scolarite.messages).toHaveLength(2);
    expect(examens.messages).toHaveLength(0);
    expect(examens.conversationId).toBeNull();
  });

  it('rend la même instance pour un même écran', () => {
    expect(useAssistantStore('examens')).toBe(useAssistantStore('examens'));
  });
});

describe('Nouvelle conversation', () => {
  it('vide le fil et détache l’identifiant', async () => {
    const store = useAssistantStore();
    poserQuestion.mockResolvedValue(reponse());
    await store.demander('question');

    store.nouvelleConversation();

    expect(store.messages).toEqual([]);
    expect(store.conversationId).toBeNull();
    expect(store.estVide).toBe(true);
  });
});
