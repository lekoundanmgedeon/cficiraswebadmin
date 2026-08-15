import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/core/auth/authStore';
import AssistantRequetes from './AssistantRequetes.vue';

/**
 * Le SQL sous une réponse est réservé au rôle ADMIN : ailleurs, il n'apprend
 * rien de contrôlable et expose le schéma de la base à chaque réponse.
 *
 * Les deux sens comptent. Le masquer à un administrateur lui retirerait le seul
 * moyen de vérifier d'où sort un chiffre ; le montrer aux autres serait la
 * fuite qu'on cherche à éviter — y compris dans le cas limite du profil pas
 * encore chargé, où l'on doit masquer plutôt que divulguer.
 */

const REQUETES = [{ intention: 'compter les inscrits', sql: 'SELECT COUNT(*) …', nbLignes: 1 }];

const monter = () => mount(AssistantRequetes, { props: { requetes: REQUETES } });

beforeEach(() => setActivePinia(createPinia()));

describe('AssistantRequetes', () => {
  it('montre les requêtes à un administrateur', async () => {
    useAuthStore().user = { role: 'ADMIN' };

    const wrapper = monter();
    await wrapper.find('button').trigger('click');

    expect(wrapper.text()).toContain('1 requête exécutée');
    expect(wrapper.find('pre').text()).toContain('SELECT COUNT(*)');
  });

  it('ne montre rien à un rôle non administrateur', () => {
    useAuthStore().user = { role: 'SCOLARITE' };

    expect(monter().find('button').exists()).toBe(false);
  });

  it('ne montre rien tant que le profil n’est pas connu', () => {
    // Un rechargement de page vide le profil en mémoire : le défaut doit se
    // faire dans le sens sûr.
    expect(useAuthStore().user).toBeNull();
    expect(monter().find('button').exists()).toBe(false);
  });

  it('n’affiche pas de bloc vide quand aucune requête n’a été exécutée', () => {
    useAuthStore().user = { role: 'ADMIN' };

    const wrapper = mount(AssistantRequetes, { props: { requetes: [] } });

    expect(wrapper.find('button').exists()).toBe(false);
  });
});
