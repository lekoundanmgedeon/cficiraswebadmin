import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { _reinitialiserRepli } from '@/shared/composables/useSidebarRepli';
import Sidebar from './sidebar.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/home' }),
}));

/**
 * Repliée, la barre latérale n'affiche que des icônes et le gabarit masque les
 * sous-menus. Sept rubriques sur dix n'ont **pas** de route propre : leur
 * entrée de premier niveau n'est que l'en-tête d'un groupe. Sans ouverture au
 * survol, elles deviendraient inatteignables — c'est l'état dans lequel se
 * trouvait l'application, le script jQuery censé s'en charger surveillant une
 * classe posée ailleurs.
 */

const monter = () =>
  mount(Sidebar, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  });

/** Le premier groupe de la barre : « Structure Académique ». */
const groupe = (wrapper) =>
  wrapper.findAll('li.nav-item').find((li) => li.find('a[href]').exists());

beforeEach(() => _reinitialiserRepli());

describe('Sidebar', () => {
  it('ouvre le groupe survolé quand la barre est repliée', async () => {
    window.innerWidth = 1152;
    const wrapper = monter();

    const item = groupe(wrapper);
    await item.trigger('mouseenter');

    expect(item.classes()).toContain('hover-open');

    await item.trigger('mouseleave');
    expect(item.classes()).not.toContain('hover-open');
  });

  it('ne l’ouvre pas au survol quand la barre est déployée', async () => {
    // Déployée, les groupes s'ouvrent au clic : une surimpression au passage de
    // la souris ne ferait que masquer le menu qu'elle recouvre.
    window.innerWidth = 1600;
    const wrapper = monter();

    const item = groupe(wrapper);
    await item.trigger('mouseenter');

    expect(item.classes()).not.toContain('hover-open');
  });

  it('nomme ses entrées par infobulle une fois repliée', async () => {
    // Réduite à une icône, une entrée sans sous-menu n'a plus rien qui la
    // désigne : le gabarit ne sort en surimpression que les groupes.
    window.innerWidth = 1152;
    const wrapper = monter();

    expect(wrapper.find('a[title="Tableau de Bord"]').exists()).toBe(true);
  });

  it('n’affiche pas d’infobulle quand les libellés sont lisibles', () => {
    window.innerWidth = 1600;
    const wrapper = monter();

    expect(wrapper.find('a[title="Tableau de Bord"]').exists()).toBe(false);
  });

  it('ouvre aussi le groupe au clic quand la barre est repliée', async () => {
    // Se fier au seul survol supposait une souris — et un clic sans effet
    // visible est ce qui donne l'impression que le menu ne répond plus.
    window.innerWidth = 1152;
    const wrapper = monter();

    const item = groupe(wrapper);
    await item.trigger('click');
    expect(item.classes()).toContain('hover-open');

    await item.trigger('click');
    expect(item.classes()).not.toContain('hover-open');
  });

  it('replie et déploie sur commande, quelle que soit la largeur', async () => {
    window.innerWidth = 1920;
    const wrapper = monter();

    const bascule = wrapper.find('.sidebar-bascule');
    expect(bascule.attributes('title')).toBe('Replier le menu');

    await bascule.trigger('click');

    expect(wrapper.find('.sidebar-bascule').attributes('title')).toBe('Déployer le menu');
    // Le repli commandé vaut le repli mesuré : les infobulles reviennent.
    expect(wrapper.find('a[title="Tableau de Bord"]').exists()).toBe(true);
  });
});
