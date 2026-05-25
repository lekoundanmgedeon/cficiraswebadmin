import buildService from '../config/serviceApi';
import { evaluationApi } from '../config/apiClients';

const evaluationService = buildService(evaluationApi);

// API pour gérer les évaluations
export const createEvaluation = (data) => evaluationService.post('/evaluations', data);

export const getEvaluations = () => evaluationService.get('/evaluations');

export const getEvaluationById = (id) => evaluationService.get(`/evaluations/${id}`);

export const updateEvaluation = (id, data) => evaluationService.put(`/evaluations/${id}`, data);

export const deleteEvaluation = (id) => evaluationService.delete(`/evaluations/${id}`);

// API pour gérer les sessions d'évaluation

// CRUD Sessions
export const createSession = (data) => evaluationService.post('/sessions', data);

export const getSessions = () => evaluationService.get('/sessions');

export const getSessionById = (id) => evaluationService.get(`/sessions/${id}`);

export const updateSession = (id, data) => evaluationService.put(`/sessions/${id}`, data);

export const deleteSession = (id) => evaluationService.delete(`/sessions/${id}`);

// Workflow de la session (machine à état)
export const changeSessionEtat = (id, data) =>
  evaluationService.patch(`/sessions/sessions-evaluations/${id}/etat`, data);
