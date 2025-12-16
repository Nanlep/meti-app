
import { ToastMessage, ToastType } from '../components/Toast';

const dispatch = (type: ToastType, message: string, duration?: number) => {
  const event = new CustomEvent<ToastMessage>('meti-toast', {
    detail: {
      id: Date.now().toString() + Math.random(),
      type,
      message,
      duration
    }
  });
  document.dispatchEvent(event);
};

export const notify = {
  success: (message: string, duration?: number) => dispatch('success', message, duration),
  error: (message: string, duration?: number) => dispatch('error', message, duration),
  info: (message: string, duration?: number) => dispatch('info', message, duration),
  warning: (message: string, duration?: number) => dispatch('warning', message, duration)
};
