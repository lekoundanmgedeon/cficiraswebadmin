import buildService from '../config/serviceApi';
import { gestionApi, gestionFormApi } from '../config/apiClients';

const gestionService = buildService(gestionApi);

// CRUD
export const getConcours = () => gestionService.get('/concours');

export const getConcoursById = (id) => gestionService.get(`/concours/${id}`);

export const createConcours = (data) => gestionService.post('/concours', data);

export const updateConcours = (id, data) => gestionService.put(`/concours/${id}`, data);

export const changeConcoursStatut = (id, data) =>
  gestionService.patch(`/concours/${id}/statut`, data);

export const deleteConcours = (id) => gestionService.delete(`/concours/${id}`);

export const getEpreuvesByConcours = (concoursId) => 
  gestionService.get(`/concours/${concoursId}/epreuves`);

export const getEpreuveById = (id) => 
  gestionService.get(`/concours/epreuves/${id}`);

export const createEpreuve = (data) => 
  gestionService.post('/concours/epreuves', data);

export const updateEpreuve = (id, data) => 
  gestionService.put(`/gestions/concours/epreuves/${id}`, data);

export const deleteEpreuve = (id) => 
  gestionService.delete(`/gestions/concours/epreuves/${id}`);

// Calculer moyennes et rangs
export const calculerMoyennesEtRangs = (id) => gestionService.get(`/concours/${id}/moyennes-rangs`);

// Proclamer admissions
export const proclamerAdmissions = (id) => gestionService.patch(`/concours/${id}/proclamer`);

// Télécharger liste des admis
export const downloadAdmis = (id) =>
  gestionService.get(`/concours/${id}/admis/export`, { responseType: 'blob' });

// 1. Créer un candidat
export const createCandidat = (data) => gestionService.post('/candidats', data);

// 2. Ajouter une pièce justificative
export const addPieceCandidat = (id, data) =>
  gestionService.post(`/candidats/${id}/pieces`, data);

// Importation par lot des candidats
export const importCandidats = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return gestionService.post('/candidats/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Importation par lot des notes
export const importNotesCandidats = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return gestionService.post('/candidats/import/notes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 3. Enregistrer une note d’épreuve
export const addNoteEpreuve = (numTable, data) =>
  gestionService.post(`/candidats/${numTable}/notes`, data);

// 5. Lister tous les candidats d’un concours
export const getCandidatsByConcours = (concoursId) =>
  gestionService.get(`/candidats/concours/${concoursId}`);

// 6. Récupérer un candidat par ID
export const getCandidatById = (id) => gestionService.get(`/candidats/${id}`);


