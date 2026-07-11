import { useToast } from "@/components/ui/use-toast";
import { useCallback } from "react";

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: "success" | "warning" | "error" | "light" | "medium" | "heavy" = "light") => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      switch (type) {
        case "light":
          window.navigator.vibrate(10);
          break;
        case "medium":
          window.navigator.vibrate(25);
          break;
        case "heavy":
          window.navigator.vibrate(50);
          break;
        case "success":
          window.navigator.vibrate([10, 30, 10]);
          break;
        case "warning":
          window.navigator.vibrate([30, 50, 30]);
          break;
        case "error":
          window.navigator.vibrate([50, 100, 50, 100]);
          break;
      }
    }
  }, []);

  return { triggerHaptic };
};

export const useSoundFeedback = () => {
  const playSound = useCallback((type: "success" | "click" | "error" | "achievement") => {
    // In a real app, these would be small encoded audio files or URL references
    // For now, we use the Web Audio API to synthesize feedback sounds
    type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
    const w = window as WebkitWindow;
    if (typeof window !== "undefined" && (window.AudioContext || w.webkitAudioContext)) {
      try {
        const AudioContextClass = window.AudioContext || w.webkitAudioContext!;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
          case "click":
            osc.type = "sine";
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
          case "success":
            osc.type = "sine";
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
          case "error":
            osc.type = "square";
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.setValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
          case "achievement":
            // Complex sound for achievements
            [600, 800, 1000].forEach((freq, i) => {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.frequency.setValueAtTime(freq, now + i * 0.1);
              g.gain.setValueAtTime(0.05, now + i * 0.1);
              g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
              o.start(now + i * 0.1);
              o.stop(now + i * 0.1 + 0.2);
            });
            break;
        }
      } catch (e) {
        // Silent fail if AudioContext is blocked
      }
    }
  }, []);

  return { playSound };
};
