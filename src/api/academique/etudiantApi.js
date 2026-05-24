import buildService from '../config/serviceApi';
import { academiqueApi } from '../config/apiClients';

const etudiantService = buildService(academiqueApi);
const etudiantFormService = buildService(academiqueFormApi);

// API pour gérer les étudiants
export const createEtudiant = (data) => etudiantService.post('/etudiants', data);

export const addTuteurToEtudiant = (etudiantId, data) =>
  etudiantFormService.post(`/etudiants/${etudiantId}/tuteurs`, data);

export const uploadPhotoEtudiant = (etudiantId, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return etudiantFormService.post(`/etudiants/${etudiantId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getParcoursAcademique = (id) =>
  etudiantService.get(`/etudiants/${id}/parcours`);

