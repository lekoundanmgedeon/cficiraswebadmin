import buildService from '../config/serviceApi';
import { academiqueApi } from '../config/apiClients';

const moduleService = buildService(academiqueApi);

// API pour gérer les modules

// Gestion des configurations semestrielles
export const getSemestresConfiguration = () =>
  moduleService.get('/modules/configuration/semestres');

export const getUesByConfiguration = () =>
  moduleService.get('/modules/configuration/details');

export const detachUeFromConfig = (attributionId) =>
  moduleService.delete(`/modules/configuration/detacher/${attributionId}`);

// Assignation d’un module à une classe
export const assignModuleToClasse = (data) =>
  moduleService.post('/modules/assigner', data);

// CRUD des modules
export const createModule = (data) =>
  moduleService.post('/modules', data);

export const updateModule = (id, data) =>
  moduleService.put(`/modules/${id}`, data);

export const deleteModule = (id) =>
  moduleService.delete(`/modules/${id}`);

