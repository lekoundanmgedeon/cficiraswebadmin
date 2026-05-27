// /composables/useNotifier.js
import { useMessageStore } from '@/stores/messages/messageStore';

export function useNotifier() {
  const messageStore = useMessageStore();

  const notifySuccess = (message) => {
    messageStore.notifySuccess(message);
  };

  const notifyError = (errorOrMessage, fallback = 'Une erreur est survenue.') => {
    messageStore.notifyError(errorOrMessage, fallback);
  };

  const notifyInfo = (message) => {
    messageStore.notifyInfo(message);
  };

  const notifyWarning = (message) => {
    messageStore.notifyWarning(message);
  };

  return {
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
  };
}


