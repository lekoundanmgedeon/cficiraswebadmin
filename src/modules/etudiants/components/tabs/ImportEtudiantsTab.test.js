// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { academiqueClient } from '@/core/api/clients';
import { clearAllCache } from '@/shared/utils/cache';
import ImportEtudiantsTab from './ImportEtudiantsTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Import d'étudiants par lot.
 *
 * Le point vérifié ici est celui qui manquait et rendait l'écran inopérant :
 * `POST /academique/imports/etudiants` **exige** `code_annee`, et le composant
 * ne l'envoyait pas. Le serveur répondait 400 à chaque tentative.
 *
 * On monte donc le composant réel et on inspecte le `FormData` effectivement
 * transmis au client HTTP — pas l'intention du code, mais ce qui part sur le
 * réseau.
 */

const ANNEES = {
  success: true,
  data: [
    { id: 'a1', code: '2023-2024', est_active: false },
    { id: 'a2', code: '2024-2025', est_active: true },
  ],
};

const RAPPORT = {
  success: true,
  message: 'Import des étudiants terminé : 3/5 lignes intégrées, 2 rejetée(s).',
  data: {
    summary: { totalTraite: 5, totalSucces: 3, totalEchecs: 2 },
    details: {
      succes: [],
      echecs: [
        { ligne: 4, etudiant: 'OKEMBA Sarah', erreur: "Le sexe doit être 'M' ou 'F' (Reçu: 'X')" },
        { ligne: 5, etudiant: 'LOUBAKI Jean', erreur: 'Classe inexistante' },
      ],
    },
  },
};

/** Fichier .xlsx minimal : seuls le nom et le type comptent pour ce test. */
function fichierExcel() {
  return new File([new Uint8Array([1, 2, 3])], 'etudiants.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('ImportEtudiantsTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    // Le cache de `createCrudStore` vit au niveau du module, pas du store : sans
    // cette purge, la liste d'années d'un test précédent survit au suivant.
    clearAllCache();
    vi.spyOn(academiqueClient, 'get').mockResolvedValue(ANNEES);
  });

  it("préselectionne l'année académique active", async () => {
    const wrapper = mount(ImportEtudiantsTab);
    await flushPromises();

    expect(wrapper.find('#import-code-annee').element.value).toBe('2024-2025');
  });

  it('transmet le fichier ET le code_annee au serveur', async () => {
    const post = vi.spyOn(academiqueClient, 'post').mockResolvedValue(RAPPORT);

    const wrapper = mount(ImportEtudiantsTab);
    await flushPromises();

    wrapper.vm.selectedFile = fichierExcel();
    await wrapper.vm.$nextTick();
    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    expect(post).toHaveBeenCalledOnce();
    const [chemin, formData] = post.mock.calls[0];

    expect(chemin).toBe('/imports/etudiants');
    expect(formData.get('file')).toBeInstanceOf(File);
    // La régression que ce test verrouille.
    expect(formData.get('code_annee')).toBe('2024-2025');
  });

  it('refuse de partir sans année choisie, sans appeler le serveur', async () => {
    // Aucune année en base : le sélecteur reste vide.
    academiqueClient.get.mockResolvedValue({ success: true, data: [] });
    const post = vi.spyOn(academiqueClient, 'post');

    const wrapper = mount(ImportEtudiantsTab);
    await flushPromises();

    wrapper.vm.selectedFile = fichierExcel();
    await wrapper.vm.$nextTick();
    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    expect(post).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Choisissez l'année académique");
  });

  it('affiche les lignes rejetées avec leur motif', async () => {
    vi.spyOn(academiqueClient, 'post').mockResolvedValue(RAPPORT);

    const wrapper = mount(ImportEtudiantsTab);
    await flushPromises();

    wrapper.vm.selectedFile = fichierExcel();
    await wrapper.vm.$nextTick();
    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    const texte = wrapper.text();
    expect(texte).toContain('3/5 ligne(s) intégrée(s)');
    expect(texte).toContain('2 rejetée(s)');
    // Le motif est la seule information sur laquelle l'opérateur peut agir.
    expect(texte).toContain('OKEMBA Sarah');
    expect(texte).toContain("Le sexe doit être 'M' ou 'F'");
  });
});
