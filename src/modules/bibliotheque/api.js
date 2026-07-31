import { bibliothequeClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints de la bibliothèque.
 *
 * Le domaine `/api/bibliotheque` a été créé avec cet écran : le menu existait
 * dans `main` (`/bibliotheque`), mais il ne pointait vers rien — ni route, ni
 * vue, ni table. Voir la migration `014_bibliotheque.sql`.
 */

const BASE_PATH = '/ouvrages';

/** CRUD standard : list, getById, create, update, patch, remove. */
export const ouvragesResource = createResource(bibliothequeClient, BASE_PATH);

/**
 * Mémoires et thèses soutenus.
 *
 * ⚠️ Ce **n'est pas** une lecture du catalogue : un mémoire n'est pas un
 * ouvrage acquis, c'est le travail d'un étudiant (`travaux_recherche`). Il
 * n'entre en bibliothèque que par sa cote et sa date de publication. Les
 * recopier dans `ouvrages` aurait créé deux titres pour un même document,
 * libres de diverger.
 *
 * @param {{publies?: boolean, type_travail?: string, q?: string}} [params]
 */
export const getMemoires = (params) => bibliothequeClient.get('/memoires', params);

/** Compteurs du fonds : titres, exemplaires, disponibles, catégories. */
export const getStatistiquesFonds = () => bibliothequeClient.get('/statistiques');
