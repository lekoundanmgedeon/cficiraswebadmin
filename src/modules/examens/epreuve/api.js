import { evaluationClient } from '@/core/api/clients';
import { createResource } from '@/core/api/createResource';

/**
 * Endpoints des épreuves (le backend les nomme « évaluations »).
 *
 * ⚠️ Le chemin est `/evaluation`, **au singulier** — alors que le domaine, lui,
 * est `/evaluations` au pluriel. L'URL complète est donc
 * `/api/evaluations/evaluation`. Ce n'est pas une coquille de ce fichier.
 *
 * ## Un CRUD qui n'a jamais fonctionné
 *
 * Le contrôleur appelait **cinq méthodes absentes de son modèle** —
 * `createEvaluation`, `getEvaluationById`, `updateEvaluation`,
 * `deleteEvaluation` — là où celui-ci expose `create`, `findById`, `update` et
 * `delete`. **Quatre des cinq routes échouaient donc systématiquement**, sur un
 * `TypeError` masqué en 500 générique. Seul `GET /evaluation` répondait.
 *
 * Et ses filtres mentaient : le contrôleur lisait `anneeId` et `semestreId` dans
 * la query string, puis les passait à un `findAll(sessionId, moduleId)`. Un
 * `?anneeId=…` était donc interprété comme un identifiant de **session**. Le
 * modèle ne sait pas filtrer par année ni par semestre.
 *
 * Corrigé côté backend. `GET /evaluation` accepte désormais `sessionId` et
 * `moduleId` — ce qu'il fait réellement.
 *
 * Le module charge malgré tout la liste complète et trie en mémoire : le
 * calendrier a besoin de toutes les épreuves, et la collection est petite. Une
 * seule requête vaut mieux qu'une par onglet.
 */

const BASE_PATH = '/evaluation';

/** CRUD standard : list, getById, create, update, remove. */
export const epreuvesResource = createResource(evaluationClient, BASE_PATH);
