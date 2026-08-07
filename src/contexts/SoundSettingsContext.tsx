import { createContext, useContext, useState, useEffect, ReactNode, forwardRef } from "react";

interface SoundSettings {
  enabled: boolean;
  volume: number;
}

interface SoundSettingsContextType {
  settings: SoundSettings;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggleSound: () => void;
}

const STORAGE_KEY = "sound_settings";

const defaultSettings: SoundSettings = {
  enabled: true,
  volume: 0.7,
};

const getStoredSettings = (): SoundSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    // Ignore errors
  }
  return defaultSettings;
};

const SoundSettingsContext = createContext<SoundSettingsContextType | undefined>(undefined);

export const SoundSettingsProvider = forwardRef<HTMLDivElement, { children: ReactNode }>(
  function SoundSettingsProvider({ children }, _ref) {
    const [settings, setSettings] = useState<SoundSettings>(getStoredSettings);

    useEffect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {
        // Ignore errors
      }
    }, [settings]);

    const setEnabled = (enabled: boolean) => {
      setSettings(prev => ({ ...prev, enabled }));
    };

    const setVolume = (volume: number) => {
      setSettings(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
    };

    const toggleSound = () => {
      setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    return (
      <SoundSettingsContext.Provider value={{ settings, setEnabled, setVolume, toggleSound }}>
        {children}
      </SoundSettingsContext.Provider>
    );
  }
);

export const useSoundSettings = () => {
  const context = useContext(SoundSettingsContext);
  if (!context) {
    throw new Error("useSoundSettings must be used within a SoundSettingsProvider");
  }
  return context;
};
