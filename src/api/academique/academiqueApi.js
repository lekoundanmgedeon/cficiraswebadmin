import buildService from '../config/serviceApi';
import { academiqueApi, academiqueFormApi } from '../config/apiClients';

const academiqueService = buildService(academiqueApi);


// API pour gérer les années académiques
export const getAnneesAcademiques = () => academiqueService.get('/annees');
export const getAnneesHistory = () => academiqueService.get('/annees/history');
export const getCurrentAnnee = () => academiqueService.get('/annees/current');
export const getAnneeById = (id) => academiqueService.get(`/annees/${id}`);
export const getAnneeStats = (id) => academiqueService.get(`/annees/${id}/stats`);
export const exportAnneeData = (id) => academiqueService.get(`/annees/${id}/export`);
export const activateAnnee = (id) => academiqueService.patch(`/annees/${id}/activate`);

export const createAnneeAcademique = (data) => academiqueService.post('/annees', data);
export const updateAnneeAcademique = (id, data) => academiqueService.put(`/annees/${id}`, data);
export const deleteAnneeAcademique = (id) => academiqueService.delete(`/annees/${id}`);


// API pour gérer les classes
export const getClasses = () => academiqueService.get('/classes');
export const getClasseById = (id) => academiqueService.get(`/classes/${id}`);

export const getClassesOrganisationTree = () => academiqueService.get('/classes/organisation/arbre');
export const getGlobalInfrastructureKPIs = () => academiqueService.get('/classes/analytics/dashboard-global');

export const getClassesByNiveau = (niveauId) => academiqueService.get(`/classes/niveau/${niveauId}`);
export const getClassesByFiliere = (filiereId) => academiqueService.get(`/classes/filiere/${filiereId}`);

export const getClasseStudents = (id) => academiqueService.get(`/classes/${id}/etudiants`);
export const getClasseModules = (id) => academiqueService.get(`/classes/${id}/modules`);
export const assignModuleToClasse = (id, data) => academiqueService.post(`/classes/${id}/assigner-module`, data);
export const getClasseOccupancyRate = (id) => academiqueService.get(`/classes/${id}/taux-remplissage`);

export const createClasse = (data) => academiqueService.post('/classes', data);
export const updateClasse = (id, data) => academiqueService.put(`/classes/${id}`, data);
export const deleteClasse = (id) => academiqueService.delete(`/classes/${id}`);




// API pour gérer les cycles
export const getCycles = () => academiqueService.get('/cycles');
export const getCycleById = (id) => academiqueService.get(`/cycles/${id}`);
export const getCycleFilieres = (id) => academiqueService.get(`/cycles/${id}/filieres`);
export const getCycleDistributionStats = () => academiqueService.get('/cycles/stats/distribution');
export const getCycleOrganisation = () => academiqueService.get('/cycles/stats/organisations/');

export const createCycle = (data) => academiqueService.post('/cycles', data);
export const updateCycle = (id, data) => academiqueService.put(`/cycles/${id}`, data);
export const deleteCycle = (id) => academiqueService.delete(`/cycles/${id}`);


// API pour gérer les filières
export const getFilieres = () => academiqueService.get('/filieres');
export const getFiliereById = (id) => academiqueService.get(`/filieres/${id}`);

export const getFiliereOrganisation = () => academiqueService.get('/filieres/organisation/arbre');
export const getFilieresByCycle = (cycleId) => academiqueService.get(`/filieres/cycle/${cycleId}`);
export const getFiliereStats = (id) => academiqueService.get(`/filieres/${id}/stats`);

export const createFiliere = (data) => academiqueService.post('/filieres', data);
export const updateFiliere = (id, data) => academiqueService.put(`/filieres/${id}`, data);
export const deleteFiliere = (id) => academiqueService.delete(`/filieres/${id}`);


// API pour gérer les niveaux
export const getNiveaux = () => academiqueService.get('/niveaux');
export const getNiveauById = (id) => academiqueService.get(`/niveaux/${id}`);

export const getNiveauxByFiliere = (filiereId) => academiqueService.get(`/niveaux/filiere/${filiereId}`);
export const getNiveauEffectifs = (id) => academiqueService.get(`/niveaux/${id}/effectifs`);

export const createNiveau = (data) => academiqueService.post('/niveaux', data);
export const updateNiveau = (id, data) => academiqueService.put(`/niveaux/${id}`, data);
export const deleteNiveau = (id) => academiqueService.delete(`/niveaux/${id}`);


// API pour gérer les semestres
export const getSemestres = () => academiqueService.get('/semestres');
export const getSemestreById = (id) => academiqueService.get(`/semestres/${id}`);

export const getActiveSemestres = () => academiqueService.get('/semestres/courants/actifs');
export const getSemestresByAnnee = (anneeId) => academiqueService.get(`/semestres/annee/${anneeId}`);

export const getSemestresOrganisation = () => academiqueService.get('/semestres/organisation');
export const getSemestreAnalytics = () => academiqueService.get('/semestres/analytics/dashboard');

export const createSemestre = (data) => academiqueService.post('/semestres', data);
export const updateSemestre = (id, data) => academiqueService.put(`/semestres/${id}`, data);
export const deleteSemestre = (id) => academiqueService.delete(`/semestres/${id}`);

export const changeSemestreStatus = (id, data) => academiqueService.patch(`/semestres/${id}/statut`, data);


// Ajoutez ces nouvelles fonctions si elles n'existent pas -- a revoir
export const getClassesByAnnee = (anneeId) => academiqueService.get(`/classes/annee/${anneeId}`);
export const getFilieresByAnnee = (anneeId) => academiqueService.get(`/filieres/annee/${anneeId}`);

// API pour gérer les inscriptions
export const getInscriptions = () => academiqueService.get('/inscriptions');
export const getInscriptionById = (id) => academiqueService.get(`/inscriptions/${id}`);

export const createInscription = (data) => academiqueService.post('/inscriptions', data);
export const updateInscription = (id, data) => academiqueService.put(`/inscriptions/${id}`, data);
export const changeInscriptionStatus = (id, data) => academiqueService.patch(`/inscriptions/${id}/statut`, data);

// Imports
export const importNouveauxEtudiants = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return academiqueService.post('/imports/etudiants', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const importReinscriptions = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return academiqueService.post('/imports/reinscriptions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const importTuteurs = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return academiqueService.post('/imports/tuteurs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

