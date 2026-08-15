import { useAuthStore } from '@/core/auth/authStore';
import { ESPACE_CHAT_BASE } from '../constants';

/**
 * Routes de l'espace de chat.
 *
 * Montées **hors du layout applicatif** (voir `core/router/index.js`) : l'espace
 * s'ouvre dans un onglet à part, sans en-tête ni menu de l'application, et porte
 * sa propre coquille.
 *
 * ## Pas de `meta.public`, et pas de garde locale
 *
 * C'est la différence de fond avec l'espace de notes, qui déclare ses routes
 * publiques pour écarter la garde générale et se protège ensuite lui-même : il a
 * sa propre session et son propre écran de connexion, vers lequel la garde
 * générale ne saurait pas renvoyer.
 *
 * L'espace de chat, lui, **partage la session de l'application** — c'est ce qui
 * lui permet d'afficher les conversations de l'utilisateur sans le faire se
 * reconnecter. La garde générale (« tout est protégé par défaut ») fait donc
 * exactement ce qu'il faut, et renvoie vers le bon écran de connexion.
 */

/**
 * L'audit est réservé aux administrateurs.
 *
 * Le rôle est relu au besoin : la connexion le renseigne, mais un rechargement
 * de page vide le profil en mémoire, et un administrateur revenu par F5 se
 * verrait refuser l'accès à son propre journal. `fetchCurrentUser` est mis en
 * cache cinq minutes par le store — l'appel ne coûte rien la plupart du temps.
 *
 * Le serveur refuse de toute façon en 403 : ce garde évite d'afficher un écran
 * vide, il ne le remplace pas.
 */
async function exigerAdmin() {
  const auth = useAuthStore();
  if (!auth.user) await auth.fetchCurrentUser();

  return auth.isAdmin ? true : { name: 'EspaceChat' };
}

export default [
  {
    path: ESPACE_CHAT_BASE,
    component: () => import('./layouts/EspaceChatLayout.vue'),
    children: [
      {
        path: '',
        name: 'EspaceChat',
        component: () => import('./views/ChatView.vue'),
        meta: { title: 'Espace de chat' },
      },
      {
        // `c/:id` plutôt que `:id` : sans segment fixe, « audit » serait
        // d'abord lu comme un identifiant de conversation.
        path: 'c/:id',
        name: 'EspaceChatConversation',
        component: () => import('./views/ChatView.vue'),
        meta: { title: 'Conversation' },
      },
      {
        path: 'audit',
        name: 'EspaceChatAudit',
        component: () => import('./views/AuditView.vue'),
        beforeEnter: exigerAdmin,
        meta: { title: 'Journal et statistiques' },
      },
    ],
  },
];
