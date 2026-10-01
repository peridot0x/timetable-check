import { NotificationSettings } from '../types';
import { timeToMinutes } from './timeCalculations';

/**
 * Play a subtle pleasant chime using Web Audio API
 */
export function playChimeSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    // Harmonic notes for positive alert: C5 -> E5 -> G5
    const freqs = [523.25, 659.25, 783.99];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  } catch {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(settings: NotificationSettings): boolean {
  if (!settings.quietHoursEnabled) return false;
  const now = new Date();
  const currentM = now.getHours() * 60 + now.getMinutes();
  const startM = timeToMinutes(settings.quietHoursStart);
  const endM = timeToMinutes(settings.quietHoursEnd);

  if (startM < endM) {
    return currentM >= startM && currentM < endM;
  } else {
    // Overnight quiet hours (e.g. 23:00 to 08:00)
    return currentM >= startM || currentM < endM;
  }
}

/**
 * Request notification permissions from browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Send a notification if permissions & user settings allow
 */
export function triggerNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
  },
  settings: NotificationSettings
): boolean {
  if (!settings.enabled) return false;
  if (isWithinQuietHours(settings)) return false;

  // Play sound if enabled
  if (settings.soundEnabled) {
    playChimeSound();
  }

  // Vibrate if mobile supported
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch {
      // ignore
    }
  }

  // System notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'gonggang-alert',
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
