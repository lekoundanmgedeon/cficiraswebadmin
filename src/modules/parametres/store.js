import { defineStore } from 'pinia';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { appliquerParametres } from '@/shared/utils/parametres';
import {
  changerMotDePasse,
  createUtilisateur,
  getParametres,
  getRoles,
  getUtilisateurs,
  putParametres,
  reinitialiserMotDePasse,
  setActif,
  updateProfil,
  updateUtilisateur,
} from './api';

/**
 * Store de l'écran Paramètres.
 *
 * ## Il dépose les réglages dans `shared/utils/parametres.js`
 *
 * `exportPDF` et le formatage des montants ont besoin des réglages, et vivent
 * dans `shared` — qui ne peut pas importer un module (règle de dépendance
 * `modules → shared → core`). Ce store appelle donc `appliquerParametres()`
 * après chaque lecture **et après chaque écriture** : sans le second appel,
 * changer le symbole de la devise n'aurait d'effet qu'au rechargement de la
 * page, ce qui se lit comme un enregistrement raté.
 *
 * ## Un seul store pour cinq onglets
 *
 * Les onglets ne partagent que leur écran, mais tous passent par le même
 * contrat `run()` — `undefined` en cas d'échec, l'UI s'y fie pour décider de
 * fermer une fenêtre modale ou non.
 */
export const useParametresStore = defineStore('parametres', {
  state: () => ({
    /** @type {Array<{categorie: string, parametres: Array<object>}>} */
    categories: [],

    /** @type {Array<object>} Comptes de la page courante. */
    utilisateurs: [],
    totalUtilisateurs: 0,

    /** @type {Array<{role: string, total: number, actifs: number}>} */
    roles: [],

    /** Filtres de la liste des comptes — appliqués **côté serveur**. */
    recherche: '',
    filtreRole: '',
    filtreActif: '',

    chargementParametres: false,
    chargementUtilisateurs: false,
    enregistrement: false,

    /** @type {import('@/core/api/apiError').ApiError|null} */
    error: null,
  }),

  getters: {
    /** Les réglages à plat : `cle → valeur`. */
    valeurs: (state) =>
      Object.fromEntries(
        state.categories.flatMap((c) => c.parametres.map((p) => [p.cle, p.valeur]))
      ),

    /** Le catalogue d'une catégorie, ou un tableau vide. */
    parametresDe: (state) => (categorie) =>
      state.categories.find((c) => c.categorie === categorie)?.parametres ?? [],
  },

  actions: {
    /**
     * @template T
     * @param {() => Promise<T>} call
     * @param {{failure?: string, success?: string, onSuccess?: (r: T) => void}} [options]
     */
    async run(call, { failure, success, onSuccess } = {}) {
      const notifications = useNotificationStore();
      this.error = null;

      try {
        const result = await call();
        await onSuccess?.(result);
        if (success) notifications.notifySuccess(success);
        return result;
      } catch (error) {
        this.error = error;
        notifications.notifyError(error, failure);
        return undefined;
      }
    },

    async fetchParametres() {
      this.chargementParametres = true;
      try {
        return await this.run(() => getParametres(), {
          failure: 'Erreur lors du chargement des paramètres.',
          onSuccess: (r) => {
            this.categories = r.data?.categories ?? [];
            appliquerParametres(this.valeurs);
          },
        });
      } finally {
        this.chargementParametres = false;
      }
    },

    /**
     * Enregistre une catégorie entière.
     *
     * @param {Record<string, string|null>} valeurs
     */
    async enregistrerParametres(valeurs) {
      this.enregistrement = true;
      try {
        return await this.run(() => putParametres(valeurs), {
          failure: "Les paramètres n'ont pas pu être enregistrés.",
          success: 'Paramètres enregistrés.',
          // Relecture complète plutôt que recopie locale : le serveur rend
          // `updated_at` et l'auteur de la modification, que le client ne peut
          // pas deviner. Elle redépose au passage les valeurs dans `shared`.
          onSuccess: () => this.fetchParametres(),
        });
      } finally {
        this.enregistrement = false;
      }
    },

    async fetchUtilisateurs() {
      this.chargementUtilisateurs = true;
      try {
        return await this.run(
          () =>
            getUtilisateurs({
              q: this.recherche.trim() || undefined,
              role: this.filtreRole || undefined,
              // Chaîne vide = « tous » : la transmettre ferait filtrer sur les
              // comptes inactifs, le serveur lisant `'' !== 'true'`.
              actif: this.filtreActif === '' ? undefined : this.filtreActif,
              limite: 200,
            }),
          {
            failure: 'Erreur lors du chargement des comptes.',
            onSuccess: (r) => {
              this.utilisateurs = r.data?.lignes ?? [];
              this.totalUtilisateurs = r.data?.total ?? 0;
            },
          }
        );
      } finally {
        this.chargementUtilisateurs = false;
      }
    },

    async fetchRoles() {
      return this.run(() => getRoles(), {
        failure: 'Erreur lors du chargement des rôles.',
        onSuccess: (r) => {
          this.roles = r.data ?? [];
        },
      });
    },

    async creerCompte(data) {
      return this.run(() => createUtilisateur(data), {
        failure: "Le compte n'a pas pu être créé.",
        success: 'Compte créé.',
        onSuccess: () => Promise.all([this.fetchUtilisateurs(), this.fetchRoles()]),
      });
    },

    async modifierCompte(id, data) {
      return this.run(() => updateUtilisateur(id, data), {
        failure: "Le compte n'a pas pu être modifié.",
        success: 'Compte mis à jour.',
        onSuccess: () => Promise.all([this.fetchUtilisateurs(), this.fetchRoles()]),
      });
    },

    /**
     * Active ou désactive un compte.
     *
     * Le serveur refuse trois cas — se désactiver soi-même, retirer son propre
     * rôle ADMIN, désactiver le dernier ADMIN actif. Ces refus arrivent en 400
     * avec un message rédigé pour être lu : `run()` le remonte tel quel.
     */
    async basculerActif(id, actif) {
      return this.run(() => setActif(id, actif), {
        failure: "L'état du compte n'a pas pu être changé.",
        onSuccess: () => Promise.all([this.fetchUtilisateurs(), this.fetchRoles()]),
      });
    },

    async reinitialiser(id, nouveau) {
      return this.run(() => reinitialiserMotDePasse(id, nouveau), {
        failure: "Le mot de passe n'a pas pu être réinitialisé.",
        success: 'Mot de passe réinitialisé.',
      });
    },

    async modifierProfil(data) {
      return this.run(() => updateProfil(data), {
        failure: "Le profil n'a pas pu être modifié.",
        success: 'Profil mis à jour.',
      });
    },

    async changerSonMotDePasse(ancien, nouveau) {
      return this.run(() => changerMotDePasse(ancien, nouveau), {
        failure: "Le mot de passe n'a pas pu être changé.",
        success: 'Mot de passe modifié.',
      });
    },
  },
});
