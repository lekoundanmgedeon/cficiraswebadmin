import buildService from '../config/serviceApi';
import { evaluationApi } from '../config/apiClients';

const resultatService = buildService(evaluationApi);

// Consulter le palmarès d'une classe
export const getBulletinsByClasse = (classeId) =>
  resultatService.get(`/resultats/classes/${classeId}/bulletins`);

// Consulter le bulletin individuel d'un étudiant
export const getBulletinEtudiant = (etudiantId, semestreId) =>
  resultatService.get(`/resultats/etudiants/${etudiantId}/bulletins/${semestreId}`);

// Action du jury de délibération
export const updateDecisionJury = (id, data) =>
  resultatService.put(`/resultats/bulletins/${id}/decision`, data);

// Action administrative : Publication officielle
export const publierBulletinsClasse = (classeId) =>
  resultatService.patch(`/resultats/classes/${classeId}/bulletins/publier`);
