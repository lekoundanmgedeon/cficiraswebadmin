import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { _reinitialiserRepli } from '@/shared/composables/useSidebarRepli';
import Header from './header.vue';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

/**
 * Le basculeur de la barre latérale est dans le bandeau de marque, à hauteur du
 * logo. La barre du haut en portait deux auparavant, à ses deux extrémités, et
 * **aucun ne fonctionnait** : celui-ci n'avait pas de gestionnaire, l'autre
 * commandait un état que rien ne rétablissait au redimensionnement.
 */

const monter = () => mount(Header);

beforeEach(() => {
  setActivePinia(createPinia());
  window.innerWidth = 1920;
  _reinitialiserRepli();
});

describe('Header', () => {
  it('porte un seul basculeur, dans le bandeau de marque', () => {
    const wrapper = monter();

    expect(wrapper.findAll('.navbar-bascule')).toHaveLength(1);
    expect(wrapper.find('.navbar-brand-wrapper .navbar-bascule').exists()).toBe(true);
    // Les deux boutons du gabarit ont disparu, avec leur `navbar-toggler`.
    expect(wrapper.find('.navbar-toggler').exists()).toBe(false);
  });

  it('replie puis déploie la barre, chevron à l’appui', async () => {
    const wrapper = monter();
    const bascule = wrapper.find('.navbar-bascule');

    expect(bascule.attributes('title')).toBe('Replier le menu');
    expect(bascule.attributes('aria-expanded')).toBe('true');
    expect(bascule.find('i').classes()).toContain('mdi-chevron-left');

    await bascule.trigger('click');

    expect(wrapper.find('.navbar-bascule').attributes('title')).toBe('Déployer le menu');
    expect(wrapper.find('.navbar-bascule').attributes('aria-expanded')).toBe('false');
    // Le chevron indique le sens du mouvement, pas l'état courant.
    expect(wrapper.find('.navbar-bascule i').classes()).toContain('mdi-chevron-right');

    await wrapper.find('.navbar-bascule').trigger('click');
    expect(wrapper.find('.navbar-bascule').attributes('title')).toBe('Replier le menu');
  });

  it('part de l’état que la largeur impose', () => {
    window.innerWidth = 1024;
    _reinitialiserRepli();

    expect(monter().find('.navbar-bascule').attributes('title')).toBe('Déployer le menu');
  });
});
