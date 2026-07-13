import { academiqueClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints des salles.
 *
 * La table `salles` existait — avec ses données — mais **aucune route ne
 * l'exposait** : seul `pedagogie/schedule.controller.js` la lisait, et le
 * domaine `/pedagogie` est commenté dans `index.routes.js` du backend, donc
 * désactivé. L'écran « Salles & horaires » n'avait par conséquent aucune source
 * et inventait ses salles (« 5 salles de 20 places »).
 *
 * Le CRUD a été ajouté côté backend (`/api/academique/salles`).
 *
 * Contraintes portées par la base :
 *  - `type` ∈ { Amphi, Cours, TD, TP, Labo }
 *  - `capacite` > 0
 *  - `code_salle` unique
 *  - les cinq colonnes sont **NOT NULL**
 */

const BASE_PATH = '/salles';

/** CRUD standard : list, getById, create, update, remove. */
export const sallesResource = createResource(academiqueClient, BASE_PATH);
