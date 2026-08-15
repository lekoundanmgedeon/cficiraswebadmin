import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { SEUIL_LARGE, SEUIL_MOYEN, _reinitialiserRepli, useSidebarRepli } from './useSidebarRepli';

/**
 * La largeur de la fenêtre fixe le **défaut** ; le choix de l'utilisateur le
 * contredit et se conserve.
 *
 * Ce qui doit tenir : que la largeur suive **dans les deux sens** — l'ancien
 * bouton laissait la barre en icônes après un retour sur grand écran —, que le
 * choix explicite l'emporte, et que l'écouteur ne survive pas aux composants
 * qui l'observent.
 *
 * ⚠️ `window.innerWidth` compte des pixels **CSS** : un écran 1920 réglé à
 * 150 % n'en présente que 1280. C'est pourquoi la largeur ne peut pas décider
 * seule — c'est très exactement ce qui a été signalé à l'usage.
 */

/** @param {number} largeur */
function poserLargeur(largeur) {
  window.innerWidth = largeur;
  window.dispatchEvent(new Event('resize'));
}

/** Un composant hôte minimal : le composable a besoin d'un cycle de vie. */
const Hote = defineComponent({
  setup() {
    const etat = useSidebarRepli();
    return () => h('span', `${etat.mode.value}:${etat.repliee.value}`);
  },
});

beforeEach(() => {
  window.innerWidth = 1600;
  _reinitialiserRepli();
});

describe('useSidebarRepli', () => {
  it('déploie la barre sur un grand écran', () => {
    window.innerWidth = SEUIL_LARGE;
    expect(mount(Hote).text()).toBe('large:false');
  });

  it('la replie sur un écran moyen', () => {
    window.innerWidth = SEUIL_LARGE - 1;
    expect(mount(Hote).text()).toBe('moyen:true');
  });

  it('la replie sur un petit écran', () => {
    window.innerWidth = SEUIL_MOYEN - 1;
    expect(mount(Hote).text()).toBe('petit:true');
  });

  it('suit le redimensionnement dans les deux sens', async () => {
    // Le défaut de l'ancien bouton : replié sur un petit écran puis rouvert sur
    // un grand, on retrouvait une barre en icônes sans savoir pourquoi.
    const wrapper = mount(Hote);
    expect(wrapper.text()).toBe('large:false');

    poserLargeur(1152);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('moyen:true');

    poserLargeur(1920);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('large:false');
  });

  it('part de la largeur réelle au montage, pas de celle du chargement', async () => {
    // Un composant monté après un changement d'écran doit se caler sur la
    // fenêtre telle qu'elle est, sans attendre un `resize`.
    window.innerWidth = 1024;

    expect(mount(Hote).text()).toBe('petit:true');
  });

  it('retire son écouteur quand plus personne n’observe', async () => {
    const premier = mount(Hote);
    const second = mount(Hote);

    premier.unmount();
    poserLargeur(1152);
    await second.vm.$nextTick();
    // Un abonné restant : l'écouteur doit toujours vivre.
    expect(second.text()).toBe('moyen:true');

    second.unmount();
    poserLargeur(1920);
    // Plus personne : l'état reste figé, l'écouteur est parti.
    expect(mount(Hote).text()).toBe('large:false');
  });
});

describe('Choix de l’utilisateur', () => {
  /** Monte l'hôte et rend l'état du composable, pour agir dessus. */
  function monterAvecEtat() {
    let etat;
    const wrapper = mount(
      defineComponent({
        setup() {
          etat = useSidebarRepli();
          return () => h('span', String(etat.repliee.value));
        },
      })
    );
    return { wrapper, etat };
  }

  it('replie sur commande, même sur un grand écran', async () => {
    window.innerWidth = 1920;
    const { wrapper, etat } = monterAvecEtat();
    expect(wrapper.text()).toBe('false');

    etat.basculer();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toBe('true');
  });

  it('déploie sur commande, même sur un écran étroit', async () => {
    // Le cas signalé : un 1920 mis à l'échelle à 150 % ne présente que 1280
    // pixels CSS, et l'application repliait une barre que l'utilisateur voulait
    // ouverte, sans recours.
    window.innerWidth = 1152;
    const { wrapper, etat } = monterAvecEtat();
    expect(wrapper.text()).toBe('true');

    etat.basculer();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toBe('false');
  });

  it('conserve le choix d’une session à l’autre', () => {
    window.innerWidth = 1920;
    const { wrapper, etat } = monterAvecEtat();
    etat.basculer();
    wrapper.unmount();

    // Ce que lit une page rechargée : le stockage, pas la largeur.
    expect(window.localStorage.getItem('cfi.sidebar.repli')).toBe('repliee');
  });

  it('cesse de suivre l’écran une fois le choix posé', async () => {
    window.innerWidth = 1920;
    const { wrapper, etat } = monterAvecEtat();
    etat.basculer();
    await wrapper.vm.$nextTick();

    poserLargeur(1152);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('true');

    poserLargeur(1920);
    await wrapper.vm.$nextTick();
    // Sans choix, la barre se serait rouverte ici : elle obéit à l'utilisateur.
    expect(wrapper.text()).toBe('true');
  });

  it('rend la main à l’écran sur demande', async () => {
    window.innerWidth = 1152;
    const { wrapper, etat } = monterAvecEtat();
    etat.basculer();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('false');

    etat.suivreEcran();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toBe('true');
    expect(window.localStorage.getItem('cfi.sidebar.repli')).toBeNull();
  });
});
