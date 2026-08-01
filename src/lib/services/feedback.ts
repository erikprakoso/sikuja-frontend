import { soundManager } from '@/lib/services/audio';

export function playSuccessFeedback(): void {
  soundManager.playSuccess();
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(50);
  }
}

export function playErrorFeedback(): void {
  soundManager.playError();
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([90, 60, 90]);
  }
}
