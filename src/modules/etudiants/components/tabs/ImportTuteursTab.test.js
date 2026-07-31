// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import * as XLSX from 'xlsx';
import { academiqueClient } from '@/core/api/clients';
import ImportTuteursTab from './ImportTuteursTab.vue';

vi.mock('vue3-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

/**
 * Import de tuteurs par lot.
 *
 * L'écran n'existait pas : `POST /academique/imports/tuteurs` était exposé par
 * le serveur sans qu'aucun composant ne l'appelle.
 *
 * Les tests portent sur ce qui doit partir sur le réseau (le champ `file`, sans
 * `code_annee` — un tuteur se rattache à un matricule, pas à une année) et sur
 * les deux façons dont une ligne peut être refusée : avant l'envoi, par la
 * validation cliente, et après, par le serveur.
 */

const RAPPORT = {
  success: true,
  message: 'Import des tuteurs terminé : 2/3 lignes intégrées, 1 rejetée(s).',
  data: {
    summary: { totalTraite: 3, totalSucces: 2, totalEchecs: 1 },
    details: {
      succes: [],
      echecs: [
        {
          ligne: 4,
          matricule_cible: 'ETU-0000-9999',
          tuteur: 'FANTOME Sans',
          erreur: 'Étudiant avec matricule ETU-0000-9999 inexistant',
        },
      ],
    },
  },
};

const LIGNE_VALIDE = {
  matricule_etudiant: 'ETU-2024-0001',
  nom: 'DIOP',
  prenom: 'Moussa',
  tel1: '+221770000000',
  tel2: '',
  email: 'moussa.diop@exemple.com',
  nationalite: 'CG',
  adresse: '12 rue de la Paix',
  ville: 'Brazzaville',
  lien_parente: 'PERE',
  est_contact_principal: 'oui',
};

/**
 * Construit un vrai classeur .xlsx et le donne au composant comme le ferait un
 * `<input type="file">` : le composable lit le binaire via `FileReader`, donc un
 * faux fichier ne suffirait pas.
 */
function classeur(lignes) {
  const worksheet = XLSX.utils.json_to_sheet(lignes);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Feuil1');
  const binaire = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

  return new File([binaire], 'tuteurs.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** Dépose le fichier et attend que `FileReader` ait rendu la main. */
async function deposer(wrapper, fichier) {
  wrapper.vm.onDrop({ dataTransfer: { files: [fichier] } });
  // `FileReader.onload` est asynchrone et hors du cycle de Vue : un
  // `flushPromises` seul ne l'attend pas.
  await vi.waitUntil(() => wrapper.vm.rows.length > 0 || wrapper.vm.errorMessage !== '', {
    timeout: 2000,
  });
  await flushPromises();
}

describe('ImportTuteursTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('envoie le fichier sur la route des tuteurs, sans code_annee', async () => {
    const post = vi.spyOn(academiqueClient, 'post').mockResolvedValue({
      success: true,
      message: 'Import des tuteurs terminé : 1 ligne(s) intégrée(s).',
      data: {
        summary: { totalTraite: 1, totalSucces: 1, totalEchecs: 0 },
        details: { echecs: [] },
      },
    });

    const wrapper = mount(ImportTuteursTab);
    await deposer(wrapper, classeur([LIGNE_VALIDE]));

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    expect(post).toHaveBeenCalledOnce();
    const [chemin, formData] = post.mock.calls[0];

    expect(chemin).toBe('/imports/tuteurs');
    expect(formData.get('file')).toBeInstanceOf(File);
    // Le tuteur se rattache au matricule : l'année n'a pas de sens ici.
    expect(formData.get('code_annee')).toBeNull();
  });

  it('refuse un fichier auquel il manque une colonne obligatoire', async () => {
    const post = vi.spyOn(academiqueClient, 'post');

    const wrapper = mount(ImportTuteursTab);
    const sansLienParente = { ...LIGNE_VALIDE };
    delete sansLienParente.lien_parente;
    await deposer(wrapper, classeur([sansLienParente]));

    expect(wrapper.vm.errorMessage).toContain('lien_parente');
    expect(wrapper.find('.btn-primary').exists()).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it("signale les lignes fautives avant l'envoi et bloque le bouton", async () => {
    const post = vi.spyOn(academiqueClient, 'post');

    const wrapper = mount(ImportTuteursTab);
    await deposer(
      wrapper,
      classeur([
        LIGNE_VALIDE,
        { ...LIGNE_VALIDE, tel1: '', email: 'pas-un-email' },
        { ...LIGNE_VALIDE, est_contact_principal: 'peut-être' },
      ])
    );

    expect(wrapper.vm.invalidRows).toHaveLength(2);
    expect(wrapper.find('.btn-primary').attributes('disabled')).toBeDefined();

    const texte = wrapper.text();
    expect(texte).toContain('2 ligne(s) à corriger');
    expect(texte).toContain('tel1 absent');
    expect(texte).toContain('format e-mail invalide');
    expect(texte).toContain('est_contact_principal : attendu oui/non');

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();
    expect(post).not.toHaveBeenCalled();
  });

  it('affiche les lignes rejetées par le serveur avec leur motif', async () => {
    vi.spyOn(academiqueClient, 'post').mockResolvedValue(RAPPORT);

    const wrapper = mount(ImportTuteursTab);
    await deposer(wrapper, classeur([LIGNE_VALIDE]));

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    const texte = wrapper.text();
    expect(texte).toContain('2/3 tuteur(s) rattaché(s)');
    expect(texte).toContain('1 rejeté(s)');
    expect(texte).toContain('ETU-0000-9999');
    expect(texte).toContain('inexistant');

    // Le fichier reste à l'écran tant qu'il porte des lignes à corriger.
    expect(wrapper.vm.selectedFile).not.toBeNull();
  });

  it('retire le fichier quand tout est passé', async () => {
    vi.spyOn(academiqueClient, 'post').mockResolvedValue({
      success: true,
      message: 'Import des tuteurs terminé : 1 ligne(s) intégrée(s).',
      data: {
        summary: { totalTraite: 1, totalSucces: 1, totalEchecs: 0 },
        details: { echecs: [] },
      },
    });

    const wrapper = mount(ImportTuteursTab);
    await deposer(wrapper, classeur([LIGNE_VALIDE]));

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    expect(wrapper.vm.selectedFile).toBeNull();
  });
});
