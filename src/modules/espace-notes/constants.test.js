import { describe, expect, it } from 'vitest';
import { capacitesDe, ETAPES, peut, ROLES_AUTORISES, STATUTS_PUBLIABLES } from './constants';

/**
 * Ces tests verrouillent le **miroir** des règles du serveur
 * (`note.controller.js` → `TRANSITIONS`). Si les deux divergent, l'interface
 * propose des boutons qui répondent 403 — ou cache des actions permises.
 */
describe('capacités de l’espace notes', () => {
  it('donne à chaque rôle exactement l’étape dont il a la charge', () => {
    expect(peut('ENSEIGNANT', 'saisir')).toBe(true);
    expect(peut('ENSEIGNANT', 'valider')).toBe(false);
    expect(peut('ENSEIGNANT', 'publier')).toBe(false);

    expect(peut('GESTIONNAIRE', 'verifier')).toBe(true);
    expect(peut('GESTIONNAIRE', 'renvoyer')).toBe(true);
    // Le gestionnaire contrôle, il ne valide pas : c'est la scolarité.
    expect(peut('GESTIONNAIRE', 'valider')).toBe(false);

    expect(peut('SCOLARITE', 'valider')).toBe(true);
    // Et la scolarité ne publie pas : c'est le directeur.
    expect(peut('SCOLARITE', 'publier')).toBe(false);

    expect(peut('DIRECTEUR', 'publier')).toBe(true);
    expect(peut('DIRECTEUR', 'publier_bulletins')).toBe(true);
    expect(peut('DIRECTEUR', 'saisir')).toBe(false);
  });

  it('laisse tout passer à l’administrateur, comme `verifierRole` côté serveur', () => {
    for (const capacite of ['saisir', 'verifier', 'valider', 'renvoyer', 'publier']) {
      expect(peut('ADMIN', capacite)).toBe(true);
    }
  });

  it('normalise la casse et ne suppose rien d’un rôle inconnu', () => {
    expect(peut('enseignant', 'saisir')).toBe(true);
    expect(peut(' Scolarite ', 'valider')).toBe(true);
    expect(peut('FINANCES', 'saisir')).toBe(false);
    expect(peut(null, 'saisir')).toBe(false);
    expect(capacitesDe(undefined)).toEqual([]);
  });

  it('n’ouvre l’espace qu’aux rôles qui y ont une attribution', () => {
    expect(ROLES_AUTORISES).toEqual(
      expect.arrayContaining(['ENSEIGNANT', 'GESTIONNAIRE', 'SCOLARITE', 'DIRECTEUR', 'ADMIN'])
    );
    expect(ROLES_AUTORISES).not.toContain('FINANCES');
    expect(ROLES_AUTORISES).not.toContain('C_CYCLE');
  });

  it('décrit quatre étapes, dont une seule sans statut serveur', () => {
    // La base ne connaît que trois statuts : la vérification n'en est pas un.
    const sansStatut = ETAPES.filter((etape) => etape.statut === null);
    expect(sansStatut).toHaveLength(1);
    expect(sansStatut[0].id).toBe('verification');

    expect(ETAPES.map((etape) => etape.statut)).toEqual(['SAISIE', null, 'VALIDEE', 'PUBLIEE']);
  });

  it('n’autorise l’application principale qu’à montrer le validé et le publié', () => {
    expect(STATUTS_PUBLIABLES).toEqual(['VALIDEE', 'PUBLIEE']);
    expect(STATUTS_PUBLIABLES).not.toContain('SAISIE');
  });
});
