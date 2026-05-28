import buildService from '../config/serviceApi';
import { evaluationApi } from '../config/apiClients';

const evaluationService = buildService(evaluationApi);

// API pour gérer les évaluations
export const createEvaluation = (data) => evaluationService.post('/evaluation', data);

export const getEvaluations = () => evaluationService.get('/evaluation');

export const getEvaluationById = (id) => evaluationService.get(`/evaluation/${id}`);

export const updateEvaluation = (id, data) => evaluationService.put(`/evaluation/${id}`, data);

export const deleteEvaluation = (id) => evaluationService.delete(`/evaluation/${id}`);

// API pour gérer les sessions d'évaluation

// CRUD Sessions
export const createSession = (data) => evaluationService.post('/sessions-evaluations/', data);

export const getSessions = () => evaluationService.get('/sessions-evaluations/');

export const getSessionById = (id) => evaluationService.get(`/sessions-evaluations/${id}`);

export const updateSession = (id, data) => evaluationService.put(`/sessions-evaluations/${id}`, data);

export const deleteSession = (id) => evaluationService.delete(`/sessions-evaluations/${id}`);

// Workflow de la session (machine à état)
export const changeSessionEtat = (id, data) =>
  evaluationService.patch(`/sessions-evaluations/${id}/etat`, data);
