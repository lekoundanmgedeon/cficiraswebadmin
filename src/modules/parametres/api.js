import { authClient, plateformeClient } from '@/core/api/clients';

/**
 * Endpoints de l'écran Paramètres.
 *
 * Trois familles, qui n'ont ni le même préfixe ni les mêmes droits :
 *
 * - `/parametres` — réglages de la plateforme. **Lecture ouverte** (le nom de
 *   l'établissement et la devise s'affichent partout), écriture réservée ADMIN ;
 * - `/utilisateurs` — comptes. Tout est réservé ADMIN ;
 * - `/auth/profil` et `/auth/mot-de-passe` — son propre compte, sans condition
 *   de rôle. L'identifiant n'y transite pas : ces routes agissent toujours sur
 *   la session, elles ne peuvent donc pas viser quelqu'un d'autre.
 */

// ── Réglages ────────────────────────────────────────────────────────────────

/**
 * Les paramètres, groupés par catégorie.
 *
 * Le groupement vient du serveur : c'est lui qui connaît les catégories, et
 * l'écran se contente de les rendre dans l'ordre reçu. Chaque entrée porte son
 * `libelle`, son `type_valeur` et sa `description` — le formulaire s'en déduit,
 * il n'est pas écrit en dur.
 *
 * @returns {Promise<{data: {categories: Array<{categorie: string, parametres: Array<object>}>, total: number}}>}
 */
export const getParametres = () => plateformeClient.get('/parametres');

/**
 * Enregistre une catégorie entière.
 *
 * En lot et non clé par clé : le serveur l'applique dans une transaction, si
 * bien qu'un type refusé au milieu ne laisse pas la moitié des réglages
 * enregistrés. Une clé absente du catalogue est refusée en 404 — on ne crée pas
 * de réglage depuis le client.
 *
 * @param {Record<string, string|null>} valeurs
 */
export const putParametres = (valeurs) => plateformeClient.put('/parametres', { valeurs });

// ── Comptes ─────────────────────────────────────────────────────────────────

/** @param {{q?: string, role?: string, actif?: boolean, limite?: number, offset?: number}} [params] */
export const getUtilisateurs = (params = {}) =>
  plateformeClient.get('/utilisateurs', { limite: 50, ...params });

/** Les rôles acceptés, avec le nombre de comptes de chacun. */
export const getRoles = () => plateformeClient.get('/utilisateurs/roles');

export const createUtilisateur = (data) => plateformeClient.post('/utilisateurs', data);

/** @param {string} id @param {{nom?, prenom?, email?, role?}} data */
export const updateUtilisateur = (id, data) => plateformeClient.put(`/utilisateurs/${id}`, data);

/**
 * Active ou désactive un compte.
 *
 * Il n'existe **pas** de suppression : onze tables désignent un compte pour dire
 * qui a fait quoi, et l'effacer laisserait ces actes sans auteur. Un compte
 * désactivé perd la main immédiatement — à la connexion comme sur ses jetons en
 * cours.
 *
 * @param {string} id @param {boolean} actif
 */
export const setActif = (id, actif) =>
  plateformeClient.patch(`/utilisateurs/${id}/actif`, { actif });

/**
 * Réinitialise le mot de passe d'un compte (administrateur).
 *
 * N'exige pas l'ancien, et ne peut pas l'exiger : l'administrateur ne le connaît
 * pas. À distinguer de `changerMotDePasse`, où l'utilisateur change le sien.
 */
export const reinitialiserMotDePasse = (id, nouveau) =>
  plateformeClient.post(`/utilisateurs/${id}/mot-de-passe`, { nouveau });

// ── Son propre compte ───────────────────────────────────────────────────────

/**
 * Modifie son profil. Ni `username` ni `role` : le premier identifie le compte
 * dans onze tables métier, le second est une décision d'administration.
 *
 * @param {{nom?: string, prenom?: string, email?: string}} data
 */
export const updateProfil = (data) => authClient.put('/profil', data);

/** L'ancien mot de passe est exigé même si la session est valide. */
export const changerMotDePasse = (ancien, nouveau) =>
  authClient.put('/mot-de-passe', { ancien, nouveau });

// ── Notifications ───────────────────────────────────────────────────────────
//
// Ce sont des messages **aux étudiants** — `notifications.etudiant_id` est
// `NOT NULL` —, pas des notifications d'interface pour les agents. L'écran les
// administre ; il ne les reçoit pas.

/** @param {{q?, type?, lu?, classe?, limite?, offset?}} [params] */
export const getNotifications = (params = {}) =>
  plateformeClient.get('/notifications', { limite: 100, ...params });

/** Répartition par type et par état de lecture. */
export const getNotificationsStats = () => plateformeClient.get('/notifications/statistiques');

/**
 * Compte les destinataires d'une cible **sans rien écrire**.
 *
 * À appeler avant toute diffusion : « à tous » vaut 893 lignes sur le jeu de
 * démonstration, et l'annoncer avant d'écrire est la seule façon d'éviter un
 * envoi massif fait par erreur.
 */
export const getDestinataires = (cible = {}) =>
  plateformeClient.get('/notifications/destinataires', cible);

/** Une ligne par destinataire — c'est ce qu'impose `etudiant_id NOT NULL`. */
export const diffuserNotification = (data) => plateformeClient.post('/notifications', data);

export const supprimerNotification = (id) => plateformeClient.delete(`/notifications/${id}`);

/**
 * Purge les notifications **lues** et plus anciennes que la rétention réglée.
 *
 * Les non lues ne partent jamais, quel que soit leur âge : les supprimer
 * priverait l'étudiant d'un message qu'il n'a pas vu.
 */
export const purgerNotifications = (jours) =>
  plateformeClient.post('/notifications/purge', jours ? { jours } : {});

// ── Journaux ────────────────────────────────────────────────────────────────
//
// Lecture seule. Un journal modifiable depuis l'interface qu'il surveille ne
// prouve plus rien.

export const getAuditFinancier = (params = {}) =>
  plateformeClient.get('/journaux/audit-financier', { limite: 50, ...params });

export const getAuditResume = () => plateformeClient.get('/journaux/audit-financier/resume');

export const getImports = (params = {}) =>
  plateformeClient.get('/journaux/imports', { limite: 50, ...params });
