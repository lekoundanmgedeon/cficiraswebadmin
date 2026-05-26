import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';
import { extractErrorMessage } from './useErrorMessage'; // Ajuste le chemin si nécessaire
import 'vue3-toastify/dist/index.css';

const defaultOptions = {
  autoClose: 3000,
  position: 'top-right',
  theme: 'light',
  pauseOnHover: true,
  closeOnClick: true,
  hideProgressBar: false,
};

export const useMessageStore = defineStore('messageStore', {
  state: () => ({
    messages: [],
  }),

  actions: {
    /**
     * Méthode pivot centrale pour enregistrer et afficher le toast
     * @private
     */
    _addMessage(message, type = 'success') {
      const newMessage = {
        id: Date.now() + Math.random(),
        message,
        type,
        timestamp: new Date(),
      };
      this.messages.push(newMessage);

      const display = {
        success: toast.success,
        info: toast.info,
        warning: toast.warning,
        error: toast.error,
      };

      const toastFunc = display[type];

      if (toastFunc) {
        toastFunc(message, defaultOptions);
      } else {
        toast(message, { ...defaultOptions, type: 'default' });
      }
    },

    /**
     * Gère aussi bien une string brute qu'un objet d'erreur Axios complet.
     */
    notifyError(errorOrMessage, fallback = 'Une erreur est survenue.') {
      const finalMessage =
        typeof errorOrMessage === 'string'
          ? errorOrMessage
          : extractErrorMessage(errorOrMessage, fallback);

      this._addMessage(finalMessage, 'error');
    },

    notifySuccess(message) {
      this._addMessage(message, 'success');
    },

    notifyInfo(message) {
      this._addMessage(message, 'info');
    },

    notifyWarning(message) {
      this._addMessage(message, 'warning');
    },

    clearMessages() {
      this.messages = [];
    },
  },
});
