/** Constantes du module Matières (modules d'enseignement). */

/** Identifiant DOM de la modale de création / édition d'un module. */
export const MODULE_MODAL_ID = 'moduleModal';

/** Identifiant DOM de la modale d'assignation d'un module à une classe. */
export const ASSIGNATION_MODAL_ID = 'assignationModuleModal';

/** Longueurs maximales acceptées par le backend. */
export const LIMITS = {
  CODE: 20,
  DESIGNATION: 150,
};

/**
 * L'enseignant est **obligatoire** pour rattacher un module à une classe.
 *
 * Rien ne le laisse deviner : le paramètre s'appelle `codeEnseignant`, il est
 * accepté à `null`, et la requête répond 200. Mais la fonction Postgres
 * `assigner_module_a_classe` contient
 *
 * ```sql
 * SELECT id INTO v_enseignant_id FROM enseignants WHERE matricule = p_code_enseignant;
 * IF v_enseignant_id IS NULL THEN statut := 'ERREUR'; ... RETURN; END IF;
 * ```
 *
 * Sans matricule, l'affectation est donc **refusée**. Pire : le message d'erreur
 * est construit par concaténation (`'…' || p_code_enseignant`), et en SQL une
 * concaténation avec `NULL` vaut `NULL` — l'échec remonte alors **sans le
 * moindre message**. D'où le libellé de repli ci-dessous.
 */
export const ENSEIGNANT_REQUIS = true;

/**
 * Le backend annonce le succès d'une assignation… même quand elle échoue.
 *
 * `POST /modules/assigner` délègue à une fonction Postgres qui renvoie
 * `{ statut, message }` au lieu de lever une exception. Le contrôleur, lui,
 * répond systématiquement **HTTP 200** avec `success: true` et le message
 * « Module assigné à la classe avec succès » :
 *
 * ```json
 * { "success": true,
 *   "message": "Module assigné à la classe avec succès",
 *   "data": { "statut": "ERREUR",
 *             "message": "Module introuvable avec le code : NEXISTEPAS" } }
 * ```
 *
 * Le vrai verdict est **dans le corps**, pas dans le code HTTP. L'ancien store
 * notifiait « Module assigné avec succès » dans tous les cas, y compris lorsque
 * rien n'avait été assigné.
 *
 * La fonction connaît **trois** statuts, et non deux :
 *  - `SUCCES` — l'affectation est créée ;
 *  - `AVERTISSEMENT` — elle existait déjà ; **rien n'est inséré** ;
 *  - `ERREUR` — module, classe, semestre ou enseignant introuvable.
 *
 * @param {any} response Réponse déballée de `POST /modules/assigner`.
 * @returns {{level: 'success'|'warning'|'error', message: string}}
 */
export function readAssignationResult(response) {
  const data = response?.data ?? {};
  const statut = String(data.statut ?? '').toUpperCase();

  if (statut === 'ERREUR') {
    return {
      level: 'error',
      // `message` peut être `null` (concaténation SQL avec un paramètre nul).
      message:
        data.message ||
        "L'assignation a échoué. Vérifiez le matricule de l'enseignant, ainsi que les codes du module, de la classe et du semestre.",
    };
  }

  if (statut === 'AVERTISSEMENT') {
    return {
      level: 'warning',
      message: data.message || 'Cette affectation existe déjà.',
    };
  }

  return {
    level: 'success',
    message: data.message || 'Module rattaché à la classe.',
  };
}
