import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AssistantFil from './AssistantFil.vue';

/**
 * Le fil est le seul endroit où le markdown d'une réponse devient visible.
 * `utils/markdown.test.js` vérifie le rendu ; ces tests-ci vérifient qu'il est
 * bien branché — et qu'il ne l'est **pas** sur la question de l'utilisateur,
 * qui doit rester le texte qu'il a tapé.
 */

const TABLEAU = ['| Filière | Étudiants |', '| --- | ---: |', '| Génie Civil | 125 |'].join('\n');

// Le fil monte `AssistantRequetes`, qui lit le rôle courant dans le store
// d'authentification pour décider s'il affiche le SQL.
beforeEach(() => setActivePinia(createPinia()));

describe('AssistantFil', () => {
  it('rend en tableau la réponse tabulaire de l’assistant', () => {
    const wrapper = mount(AssistantFil, {
      props: { messages: [{ role: 'assistant', texte: TABLEAU }] },
    });

    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.text()).toContain('Génie Civil');
    // Les barres verticales ne doivent plus apparaître : c'est précisément ce
    // que l'utilisateur voyait avant.
    expect(wrapper.text()).not.toContain('| ---');
  });

  it('laisse la question de l’utilisateur telle qu’il l’a tapée', () => {
    const wrapper = mount(AssistantFil, {
      props: { messages: [{ role: 'user', texte: 'Combien d’étudiants **en L1** ?' }] },
    });

    expect(wrapper.find('strong').exists()).toBe(false);
    expect(wrapper.text()).toContain('**en L1**');
  });

  it('n’exécute pas le HTML d’une réponse', () => {
    // Une réponse charrie des libellés venus de la base : ce n'est pas une
    // source de confiance.
    const wrapper = mount(AssistantFil, {
      props: { messages: [{ role: 'assistant', texte: '<img src=x onerror=alert(1)>' }] },
    });

    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).toContain('<img');
  });

  it('signale l’attente pendant qu’une question court', () => {
    const wrapper = mount(AssistantFil, {
      props: { messages: [], enCours: true },
    });

    expect(wrapper.text()).toContain("L'assistant interroge les données");
  });
});
