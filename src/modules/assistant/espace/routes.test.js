import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import routes from './routes';

/**
 * Ces tests verrouillent le contraire de ceux de l'espace de notes, et c'est
 * voulu.
 *
 * L'espace de notes déclare ses routes `public` pour écarter la garde générale,
 * puis se protège lui-même : il a sa propre session et son propre écran de
 * connexion. L'espace de chat partage la session de l'application — la garde
 * générale doit donc s'appliquer, et un `meta.public` posé par mégarde ouvrirait
 * l'historique des conversations à qui tape l'URL sans être connecté.
 */
describe('routes de l’espace de chat', () => {
  const router = createRouter({ history: createMemoryHistory(), routes });

  it('résout les trois écrans', () => {
    expect(router.resolve('/espace-chat').name).toBe('EspaceChat');
    expect(router.resolve('/espace-chat/c/fil-1').name).toBe('EspaceChatConversation');
    expect(router.resolve('/espace-chat/audit').name).toBe('EspaceChatAudit');
  });

  it('ne déclare aucune route publique : la garde générale les protège', () => {
    for (const chemin of ['/espace-chat', '/espace-chat/c/fil-1', '/espace-chat/audit']) {
      const resolue = router.resolve(chemin);
      expect(resolue.matched.some((route) => route.meta.public)).toBe(false);
    }
  });

  it('monte les écrans dans la coquille de l’espace, jamais dans le layout applicatif', () => {
    const resolue = router.resolve('/espace-chat');
    // Coquille de l'espace + vue : deux niveaux, et aucun `DefaultLayout`.
    expect(resolue.matched).toHaveLength(2);
  });

  it('lit « audit » comme un écran, pas comme un identifiant de conversation', () => {
    // C'est ce que le segment fixe `c/` évite : sans lui, `/espace-chat/audit`
    // tenterait d'ouvrir une conversation nommée « audit ».
    expect(router.resolve('/espace-chat/audit').params.id).toBeUndefined();
    expect(router.resolve('/espace-chat/c/audit').params.id).toBe('audit');
  });

  it('réserve l’audit aux administrateurs', () => {
    const audit = router.resolve('/espace-chat/audit');
    expect(typeof audit.matched.at(-1).beforeEnter).toBe('function');
  });
});
