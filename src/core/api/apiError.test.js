import { describe, expect, it } from 'vitest';
import { ApiError, normalizeApiError } from './apiError';

describe('normalizeApiError', () => {
  it('extrait `data.message`', () => {
    const error = normalizeApiError({
      response: { status: 400, data: { message: 'Code déjà pris' } },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Code déjà pris');
    expect(error.status).toBe(400);
  });

  it('combine `data.message` et `data.error.message`', () => {
    const error = normalizeApiError({
      response: { status: 400, data: { message: 'Échec', error: { message: 'code dupliqué' } } },
    });

    expect(error.message).toBe('Échec (code dupliqué)');
  });

  it('ne répète pas le message quand les deux emplacements portent le même texte', () => {
    // Le backend le fait chaque fois qu'un contrôleur remonte le message d'une
    // exception métier : `response.error(res, error, error.message, …)`.
    const identique = 'Quota dépassé — réessayez dans 8 minutes.';
    const error = normalizeApiError({
      response: { status: 429, data: { message: identique, error: { message: identique } } },
    });

    expect(error.message).toBe(identique);
  });

  it('accepte un corps de réponse en texte brut', () => {
    const error = normalizeApiError({ response: { status: 500, data: 'Erreur interne' } });

    expect(error.message).toBe('Erreur interne');
  });

  it('prend la première erreur de validation par champ', () => {
    const error = normalizeApiError({
      response: { status: 422, data: { errors: { code: ['Le code est obligatoire.'] } } },
    });

    expect(error.message).toBe('Le code est obligatoire.');
    expect(error.isValidationError).toBe(true);
    expect(error.fieldErrors).toEqual({ code: ['Le code est obligatoire.'] });
  });

  it('se rabat sur le code HTTP quand le corps est inexploitable', () => {
    const error = normalizeApiError({ response: { status: 503, data: {} } });

    expect(error.message).toBe('Erreur serveur (code 503)');
  });

  it('détecte une erreur réseau (requête partie, aucune réponse)', () => {
    const error = normalizeApiError({ request: {} });

    expect(error.message).toBe('Impossible de se connecter au serveur.');
    expect(error.isNetworkError).toBe(true);
    expect(error.status).toBeUndefined();
  });

  it('marque isUnauthorized sur un 401', () => {
    const error = normalizeApiError({ response: { status: 401, data: {} } });

    expect(error.isUnauthorized).toBe(true);
  });

  // La normalisation est appliquée par l'intercepteur puis, par sécurité, par le
  // store : elle doit être idempotente.
  it('ne ré-emballe pas une ApiError déjà normalisée', () => {
    const original = new ApiError({ message: 'Déjà normalisée', status: 400 });

    expect(normalizeApiError(original)).toBe(original);
  });

  it('utilise le message de repli sur une erreur inconnue', () => {
    const error = normalizeApiError(null, 'Repli');

    expect(error.message).toBe('Repli');
  });
});
