import buildService from '../config/serviceApi';
import { academiqueApi } from '../config/apiClients';

const etudiantService = buildService(academiqueApi);

// API pour gérer les étudiants
export const createEtudiant = (data) => etudiantService.post('/etudiants', data);

export const addTuteurToEtudiant = (etudiantId, data) =>
  etudiantService.post(`/etudiants/${etudiantId}/tuteurs`, data);

export const uploadPhotoEtudiant = (etudiantId, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return etudiantService.post(`/etudiants/${etudiantId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getEtudiantById = (id) => etudiantService.get(`/etudiants/${id}`);

export const getEtudiantsByClasseFiliereAnnee = (classeId, filiereId, anneeId) =>
  etudiantService.get('/etudiants', {
    params: {
      classeId,
      filiereId,
      anneeId,
    },
  });

export const getParcoursAcademique = (id) => etudiantService.get(`/etudiants/${id}/parcours`);
