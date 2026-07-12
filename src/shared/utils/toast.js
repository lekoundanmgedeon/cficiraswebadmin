// src/utils/toast.js
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const defaultOptions = {
  autoClose: 3000,
  position: 'top-right',
  theme: 'light',
  pauseOnHover: true,
  closeOnClick: true,
  hideProgressBar: false,
};

export const showToast = (message, type = 'default') => {
  const fn = {
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
    default: toast,
  }[type];

  fn(message, defaultOptions);
};
export const showSuccessToast = (message) => {
  showToast(message, 'success');
};
export const showErrorToast = (message) => {
  showToast(message, 'error');
};
export const showInfoToast = (message) => {
  showToast(message, 'info');
};
