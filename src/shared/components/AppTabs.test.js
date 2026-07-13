import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h } from 'vue';
import AppTabs from './AppTabs.vue';

/**
 * `AppTabs` est monté par **tous** les modules migrés : s'il ne rend pas le
 * panneau actif, ce sont tous les écrans refactorisés qui paraissent vides.
 * Ces tests figent son contrat.
 */

const Premier = defineComponent({
  name: 'Premier',
  setup: () => () => h('div', { class: 'panneau-1' }, 'contenu du premier'),
});

const Second = defineComponent({
  name: 'Second',
  props: { etiquette: { type: String, default: '' } },
  setup: (props) => () => h('div', { class: 'panneau-2' }, `second : ${props.etiquette}`),
});

/** Un composant à plusieurs nœuds racines — `KeepAlive` y est réputé sensible. */
const Fragment = defineComponent({
  name: 'Fragment',
  setup: () => () => [h('p', 'un'), h('p', 'deux')],
});

describe('AppTabs', () => {
  it('rend le panneau du premier onglet au montage', () => {
    const wrapper = mount(AppTabs, {
      props: {
        tabs: [
          { id: 'a', label: 'A', component: Premier },
          { id: 'b', label: 'B', component: Second },
        ],
      },
    });

    expect(wrapper.find('.panneau-1').exists()).toBe(true);
    expect(wrapper.text()).toContain('contenu du premier');
    expect(wrapper.find('.panneau-2').exists()).toBe(false);
  });

  it('bascule sur le panneau du second onglet au clic', async () => {
    const wrapper = mount(AppTabs, {
      props: {
        tabs: [
          { id: 'a', label: 'A', component: Premier },
          { id: 'b', label: 'B', component: Second },
        ],
      },
    });

    await wrapper.findAll('button.nav-link')[1].trigger('click');

    expect(wrapper.find('.panneau-2').exists()).toBe(true);
    expect(wrapper.find('.panneau-1').exists()).toBe(false);
  });

  it('transmet les props déclarées sur l’onglet', async () => {
    const wrapper = mount(AppTabs, {
      props: {
        tabs: [
          { id: 'a', label: 'A', component: Premier },
          { id: 'b', label: 'B', component: Second, props: { etiquette: 'transmise' } },
        ],
      },
    });

    await wrapper.findAll('button.nav-link')[1].trigger('click');

    expect(wrapper.text()).toContain('second : transmise');
  });

  it('honore `defaultTab`', () => {
    const wrapper = mount(AppTabs, {
      props: {
        tabs: [
          { id: 'a', label: 'A', component: Premier },
          { id: 'b', label: 'B', component: Second },
        ],
        defaultTab: 'b',
      },
    });

    expect(wrapper.find('.panneau-2').exists()).toBe(true);
  });

  it('rend un onglet à plusieurs nœuds racines', () => {
    const wrapper = mount(AppTabs, {
      props: { tabs: [{ id: 'a', label: 'A', component: Fragment }] },
    });

    expect(wrapper.text()).toContain('un');
    expect(wrapper.text()).toContain('deux');
  });

  it('rend le panneau quand la liste d’onglets est un `computed`', () => {
    // C'est ainsi que les vues de détail (dossier scolaire, fiche…) la
    // construisent : les composants transitent alors par une valeur réactive.
    const tabs = computed(() => [{ id: 'a', label: 'A', component: Premier }]);

    const wrapper = mount(AppTabs, { props: { tabs: tabs.value } });

    expect(wrapper.find('.panneau-1').exists()).toBe(true);
  });

  it('n’émet aucun avertissement Vue', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(AppTabs, {
      props: {
        tabs: [
          { id: 'a', label: 'A', component: Premier },
          { id: 'b', label: 'B', component: Second },
        ],
      },
    });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
