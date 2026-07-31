import { documentClient } from '@/core/api/clients';

/**
 * Endpoints du guichet des documents administratifs.
 *
 * Les menus `/demande-diplome`, `/edition-diplome` et `/historique-diplome`
 * existaient dans `main` sans route ni vue. Le domaine `/api/documents`, ses
 * deux tables et la vue de suivi sont créés avec cet écran — voir la migration
 * `016_documents_administratifs.sql`.
 */

/**
 * Catalogue des documents délivrables.
 *
 * C'est une **table** (`types_documents`), pas une liste codée ici : ajouter un
 * certificat ne demande pas de livrer une version du frontend. Chaque type
 * porte son préfixe de numérotation, son délai de traitement et ce qu'il exige
 * (année, classe).
 *
 * @param {{tous?: boolean}} [params] `tous: true` inclut les types désactivés.
 */
export const getTypesDocuments = (params) => documentClient.get('/types', params);

/**
 * Demandes, filtrables.
 * @param {{statut?: string, etudiantId?: string, type?: string, traitees?: boolean, q?: string}} [params]
 */
export const getDemandes = (params) => documentClient.get('/demandes', params);

/** @param {string} id */
export const getDemandeById = (id) => documentClient.get(`/demandes/${id}`);

/**
 * Dépose une demande.
 *
 * Le **numéro officiel** (`ATT-2026-0001`) est attribué par le serveur, dans la
 * transaction d'enregistrement : il vient de `fn_numero_document`, la fonction
 * de numérotation présente en base depuis le début et qu'aucun appelant
 * n'utilisait. L'échéance découle du délai du type demandé.
 *
 * @param {{etudiant_id: string, type_document: string, annee_academique_id?: string,
 *          classe_id?: string, motif?: string, nb_exemplaires?: number, urgence?: boolean}} data
 */
export const createDemande = (data) => documentClient.post('/demandes', data);

/**
 * Fait avancer une demande dans son circuit.
 *
 * Les transitions sont contraintes côté serveur : `SOUMISE → EN_TRAITEMENT →
 * PRETE → DELIVREE`, avec rejet possible tant que le document n'est pas prêt.
 * Une transition impossible répond **409** et dit pourquoi ; un rejet sans
 * motif est refusé.
 *
 * @param {string} id
 * @param {'EN_TRAITEMENT'|'PRETE'|'DELIVREE'|'REJETEE'} statut
 * @param {{commentaire?: string, motif_rejet?: string, fichier_genere?: string}} [donnees]
 */
export const changerStatutDemande = (id, statut, donnees = {}) =>
  documentClient.patch(`/demandes/${id}/statut`, { statut, ...donnees });

/** @param {string} id */
export const deleteDemande = (id) => documentClient.delete(`/demandes/${id}`);

/** Compteurs du guichet : en attente, en retard, délivrées, rejetées. */
export const getStatistiquesDemandes = () => documentClient.get('/statistiques');
