/**
 * Vocabulaire des résultats.
 *
 * Toutes ces valeurs viennent des **contraintes `CHECK` de la base**, relevées
 * là et non devinées — aucun script de migration ne les versionne pour la
 * partie ancienne du schéma :
 *
 * - `bulletins_semestriels.decision`           → EN_ATTENTE, VALIDE, AJOURNE, RATTRAPAGE
 * - `bulletins_semestriels.mention`            → PASSABLE … EXCELLENT (nullable)
 * - `bulletins_semestriels.statut_publication` → BROUILLON, PUBLIE, VERROUILLE
 * - `bulletins_semestriels.moyenne_generale`   → CHECK (>= 0 AND <= 20)
 */

/** @type {Record<string, {label: string, classe: string}>} */
export const DECISIONS = {
  EN_ATTENTE: { label: 'En attente', classe: 'bg-soft-secondary text-secondary' },
  VALIDE: { label: 'Validé', classe: 'bg-soft-success text-success' },
  RATTRAPAGE: { label: 'Rattrapage', classe: 'bg-soft-warning text-warning' },
  AJOURNE: { label: 'Ajourné', classe: 'bg-soft-danger text-danger' },
};

/** @type {Record<string, {label: string, classe: string}>} */
export const MENTIONS = {
  PASSABLE: { label: 'Passable', classe: 'bg-soft-secondary text-secondary' },
  ASSEZ_BIEN: { label: 'Assez bien', classe: 'bg-soft-primary text-primary' },
  BIEN: { label: 'Bien', classe: 'bg-soft-primary text-primary' },
  TRES_BIEN: { label: 'Très bien', classe: 'bg-soft-success text-success' },
  EXCELLENT: { label: 'Excellent', classe: 'bg-soft-success text-success' },
};

/**
 * Les tranches de moyenne, dans l'ordre croissant.
 *
 * Le découpage est fait **côté serveur** (colonne `tranche` de
 * `vue_statistiques_resultats`) pour que tous les écrans coupent au même
 * endroit. Cette liste ne sert qu'à garantir l'ordre d'affichage et à faire
 * apparaître les tranches vides, que le `GROUP BY` omet.
 */
export const TRANCHES = ['[0-5[', '[5-8[', '[8-10[', '[10-12[', '[12-14[', '[14-16[', '[16-20]'];

/** Couleur d'une tranche : rouge sous 10, vert au-dessus. La barre des 10 est la seule qui compte. */
export const couleurTranche = (tranche) =>
  ['[0-5[', '[5-8[', '[8-10['].includes(tranche)
    ? 'rgba(220, 53, 69, 0.85)'
    : 'rgba(40, 167, 69, 0.85)';

/** @param {string} decision */
export const infoDecision = (decision) =>
  DECISIONS[decision] ?? { label: decision || 'Inconnu', classe: 'bg-light text-dark' };

/** @param {string} mention */
export const infoMention = (mention) =>
  MENTIONS[mention] ?? { label: mention || '—', classe: 'bg-light text-dark' };

/**
 * Formate une moyenne sur 20.
 *
 * L'agrégat sert ses moyennes en **chaînes** (`"15.50"`) — `pg` fait ainsi pour
 * les `NUMERIC` — et **`null`** quand le périmètre est vide (`AVG` d'un ensemble
 * vide). Les deux cas passent ici : sans ce garde, un filtre sans résultat
 * afficherait « NaN/20 ».
 *
 * @param {number|string|null|undefined} valeur
 */
export const formatMoyenne = (valeur) => {
  if (valeur === null || valeur === undefined || valeur === '') return '—';
  const nombre = Number(valeur);
  return Number.isNaN(nombre) ? '—' : `${nombre.toFixed(2)}/20`;
};

/**
 * Taux de réussite en pourcentage.
 *
 * @param {number} admis
 * @param {number} effectif
 */
export const tauxReussite = (admis, effectif) =>
  effectif > 0 ? (Number(admis ?? 0) / Number(effectif)) * 100 : 0;
