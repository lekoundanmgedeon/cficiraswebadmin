import { describe, expect, it } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import routes from '@/modules/espace-notes/routes';

describe('routes de l’espace notes', () => {
  const router = createRouter({ history: createMemoryHistory(), routes });

  it('résout les quatre écrans', () => {
    expect(router.resolve('/espace-notes').name).toBe('EspaceNotesTableauBord');
    expect(router.resolve('/espace-notes/connexion').name).toBe('EspaceNotesConnexion');
    expect(router.resolve('/espace-notes/grilles').name).toBe('EspaceNotesGrille');
    expect(router.resolve('/espace-notes/moyennes').name).toBe('EspaceNotesMoyennes');
  });

  it('monte le tableau de bord dans la coquille de l’espace, jamais dans le layout applicatif', () => {
    const resolue = router.resolve('/espace-notes');
    // parent sans composant + coquille de l'espace + vue = 3 niveaux appariés.
    expect(resolue.matched).toHaveLength(3);

    // Toutes ces routes échappent à la garde générale (qui renverrait vers le
    // `Login` de l'application) : chacune est protégée par `beforeEnter`, qui
    // renvoie, lui, vers la connexion de l'espace.
    expect(resolue.matched.every((route) => route.meta.public)).toBe(true);
    expect(typeof resolue.matched.at(-1).beforeEnter).toBe('function');
  });

  it('renvoie vers la connexion de l’espace, et non vers celle de l’application', () => {
    localStorage.clear();
    const grille = router.resolve('/espace-notes/grilles');
    const garde = grille.matched.at(-1).beforeEnter;

    expect(garde(grille)).toEqual({
      name: 'EspaceNotesConnexion',
      query: { redirect: '/espace-notes/grilles' },
    });
  });
});
