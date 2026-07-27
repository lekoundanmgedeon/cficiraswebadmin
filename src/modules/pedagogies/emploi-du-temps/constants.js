/**
 * Vocabulaire de l'emploi du temps général.
 */

/**
 * Les jours ouvrés de la grille.
 *
 * ⚠️ Le backend **dérive le jour de la date** à l'écriture, et le stocke en
 * **majuscules** (`'LUNDI'`). L'ancien écran comparait à des identifiants en
 * minuscules (`'lundi'`) : le rapprochement n'aurait jamais fonctionné. `id`
 * porte donc la valeur telle que le serveur la sert, `label` celle qu'on
 * affiche.
 */
export const JOURS = [
  { id: 'LUNDI', label: 'Lundi' },
  { id: 'MARDI', label: 'Mardi' },
  { id: 'MERCREDI', label: 'Mercredi' },
  { id: 'JEUDI', label: 'Jeudi' },
  { id: 'VENDREDI', label: 'Vendredi' },
  { id: 'SAMEDI', label: 'Samedi' },
];

/** Rang d'un jour dans la semaine, pour trier une liste hétérogène. */
export const ordreJour = (jour) => {
  const index = JOURS.findIndex((j) => j.id === String(jour ?? '').toUpperCase());
  return index === -1 ? JOURS.length : index;
};

/**
 * Types de cours et leur pastille.
 *
 * Les valeurs proviennent de ce que le formulaire de saisie envoie
 * (`pedagogies/crenaux`) : la colonne `schedule.type_cours` ne porte pas de
 * contrainte `CHECK`, donc tout autre libellé reste possible et retombe sur le
 * style neutre.
 */
export const TYPES_COURS = {
  CM: { label: 'Cours magistral', classe: 'bg-soft-primary text-primary' },
  TD: { label: 'Travaux dirigés', classe: 'bg-soft-success text-success' },
  TP: { label: 'Travaux pratiques', classe: 'bg-soft-warning text-warning' },
  EXAMEN: { label: 'Examen', classe: 'bg-soft-danger text-danger' },
};

/** @param {string} type */
export const infoType = (type) =>
  TYPES_COURS[String(type ?? '').toUpperCase()] ?? {
    label: type || '—',
    classe: 'bg-light text-dark',
  };

/**
 * Formate une heure servie par PostgreSQL.
 *
 * `time` arrive en `'08:00:00'` : les secondes n'apportent rien sur une grille
 * horaire et allongent chaque cellule.
 *
 * @param {string|null|undefined} heure
 */
export const formatHeure = (heure) => {
  if (!heure) return '—';
  const [h, m] = String(heure).split(':');
  return h && m ? `${h}:${m}` : String(heure);
};

/** Plage horaire d'un créneau, prête à afficher. */
export const plageHoraire = (creneau) =>
  `${formatHeure(creneau.heure_debut)} – ${formatHeure(creneau.heure_fin)}`;

/** Libellé lisible d'un jour servi en majuscules. */
export const libelleJour = (jour) =>
  JOURS.find((j) => j.id === String(jour ?? '').toUpperCase())?.label ?? (jour || '—');
