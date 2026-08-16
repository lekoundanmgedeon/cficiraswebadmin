import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('../api', () => ({
  getParametres: vi.fn(() => Promise.resolve({ data: { categories: [], total: 0 } })),
  putParametres: vi.fn(),
  getUtilisateurs: vi.fn(() => Promise.resolve({ data: { lignes: [], total: 0 } })),
  getRoles: vi.fn(() => Promise.resolve({ data: [] })),
  createUtilisateur: vi.fn(),
  updateUtilisateur: vi.fn(),
  setActif: vi.fn(),
  reinitialiserMotDePasse: vi.fn(),
  updateProfil: vi.fn(),
  changerMotDePasse: vi.fn(),
  getNotifications: vi.fn(() => Promise.resolve({ data: { lignes: [], total: 0 } })),
  getNotificationsStats: vi.fn(() => Promise.resolve({ data: [] })),
  getDestinataires: vi.fn(() => Promise.resolve({ data: { nombre: 0 } })),
  diffuserNotification: vi.fn(),
  supprimerNotification: vi.fn(),
  purgerNotifications: vi.fn(),
  getAuditFinancier: vi.fn(() => Promise.resolve({ data: { lignes: [], total: 0 } })),
  getAuditResume: vi.fn(() => Promise.resolve({ data: [] })),
  getImports: vi.fn(() => Promise.resolve({ data: { lignes: [], total: 0 } })),
}));

vi.mock('@/shared/stores/notificationStore', () => ({
  useNotificationStore: () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
    notifyWarning: vi.fn(),
  }),
}));

import { useAuthStore } from '@/core/auth/authStore';
import ParametresView from './ParametresView.vue';

/**
 * Le cloisonnement des onglets par rôle.
 *
 * ⚠️ **C'est du confort d'interface, pas une sécurité.** Le serveur refuse
 * `/utilisateurs`, `/journaux` et l'écriture des réglages en 403 quel que soit
 * l'écran, et c'est lui qui fait foi. Masquer évite seulement d'offrir des
 * onglets qui s'ouvriraient vides.
 *
 * Ce qui compte ici, c'est le **sens du défaut** : le rôle vient du profil en
 * mémoire, qu'un rechargement de page perd. S'il manque, on masque — on ne
 * divulgue pas.
 */

const monter = () =>
  mount(ParametresView, {
    global: {
      stubs: {
        PageHeader: { template: '<div />' },
        // Les onglets ne sont pas montés : on vérifie la liste qu'ils reçoivent,
        // pas leur contenu — chacun a ses propres tests.
        //
        // Le `name` explicite n'est pas décoratif : un stub déclaré par sa seule
        // clé reste anonyme, et `findComponent({ name })` ne le retrouve pas.
        AppTabs: { name: 'AppTabs', props: ['tabs'], template: '<div />' },
      },
    },
  });

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

/** @param {string|null} role */
function connecterAvec(role) {
  const auth = useAuthStore();
  vi.spyOn(auth, 'fetchCurrentUser').mockResolvedValue(null);
  auth.user = role ? { id: 'u1', username: 'x', role } : null;
  return auth;
}

describe('Onglets selon le rôle', () => {
  it('ouvre les cinq onglets à un administrateur', () => {
    connecterAvec('ADMIN');

    const tabs = monter().findComponent({ name: 'AppTabs' }).props('tabs');

    expect(tabs.map((t) => t.id)).toEqual([
      'mon-compte',
      'comptes',
      'reglages',
      'notifications',
      'journaux',
    ]);
  });

  it('n’en laisse qu’un aux autres rôles', () => {
    connecterAvec('SCOLARITE');

    const tabs = monter().findComponent({ name: 'AppTabs' }).props('tabs');

    expect(tabs.map((t) => t.id)).toEqual(['mon-compte']);
  });

  it('masque plutôt que de divulguer quand le rôle est inconnu', () => {
    // Après un rechargement de page, le profil en mémoire est vide le temps de
    // l'appel : le défaut doit se faire dans le sens sûr.
    connecterAvec(null);

    const tabs = monter().findComponent({ name: 'AppTabs' }).props('tabs');

    expect(tabs.map((t) => t.id)).toEqual(['mon-compte']);
  });

  it('« Mon compte » est toujours en premier', () => {
    // C'est le seul onglet destiné à tous : le reléguer derrière des onglets
    // vides serait le rendre introuvable pour la majorité des utilisateurs.
    connecterAvec('ADMIN');

    const tabs = monter().findComponent({ name: 'AppTabs' }).props('tabs');

    expect(tabs[0].id).toBe('mon-compte');
  });
});
