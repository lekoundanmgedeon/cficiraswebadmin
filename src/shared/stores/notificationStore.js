import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import { normalizeApiError } from '@/core/api/apiError';

/**
 * Notifications utilisateur (toasts) et historique des messages.
 *
 * Unifie les cinq fichiers de `stores/messages/` (messageStore, errorStore,
 * useNotifier, useErrorHandler, useErrorMessage) qui exposaient trois chemins
 * concurrents pour afficher la même erreur.
 */

const TOAST_OPTIONS = {
  autoClose: 3000,
  position: 'top-right',
  theme: 'light',
  pauseOnHover: true,
  closeOnClick: true,
};

const TOAST_BY_TYPE = {
  success: toast.success,
  info: toast.info,
  warning: toast.warning,
  error: toast.error,
};

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    /** @type {Array<{id: string, message: string, type: string, at: Date}>} */
    messages: [],
  }),

  actions: {
    /**
     * @param {string} message
     * @param {'success'|'info'|'warning'|'error'} type
     */
    notify(message, type = 'success') {
      this.messages.push({
        id: `${Date.now()}-${Math.random()}`,
        message,
        type,
        at: new Date(),
      });

      const show = TOAST_BY_TYPE[type] ?? toast;
      // Une erreur mérite d'être lue : on laisse le toast plus longtemps.
      show(message, { ...TOAST_OPTIONS, autoClose: type === 'error' ? 5000 : 3000 });
    },

    /** @param {string} message */
    notifySuccess(message) {
      this.notify(message, 'success');
    },

    /** @param {string} message */
    notifyInfo(message) {
      this.notify(message, 'info');
    },

    /** @param {string} message */
    notifyWarning(message) {
      this.notify(message, 'warning');
    },

    /**
     * Accepte aussi bien une chaîne qu'une erreur (Axios, ApiError ou native).
     * @param {unknown} errorOrMessage
     * @param {string} [fallback]
     */
    notifyError(errorOrMessage, fallback = 'Une erreur est survenue.') {
      const message =
        typeof errorOrMessage === 'string'
          ? errorOrMessage
          : normalizeApiError(errorOrMessage, fallback).message;

      this.notify(message, 'error');
    },

    clearMessages() {
      this.messages = [];
    },
  },
});
