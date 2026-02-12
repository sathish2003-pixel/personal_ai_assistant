import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  voiceName: 'default',
  theme: 'dark',
  soundsEnabled: true,
  soundsVolume: 0.5,
  reminderOffset: 15,
  language: 'en-US',
  settingsOpen: false,

  setVoiceSpeed: (speed) => set({ voiceSpeed: speed }),
  setVoicePitch: (pitch) => set({ voicePitch: pitch }),
  setVoiceName: (name) => set({ voiceName: name }),
  setSoundsEnabled: (enabled) => set({ soundsEnabled: enabled }),
  setSoundsVolume: (volume) => set({ soundsVolume: volume }),
  setReminderOffset: (offset) => set({ reminderOffset: offset }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  loadFromPreferences: (prefs) => {
    if (!prefs) return;
    set({
      voiceSpeed: prefs.voice_speed ?? 1.0,
      voicePitch: prefs.voice_pitch ?? 1.0,
      voiceName: prefs.voice_name ?? 'default',
      theme: prefs.theme ?? 'dark',
      soundsEnabled: prefs.sounds_enabled ?? true,
      soundsVolume: prefs.sounds_volume ?? 0.5,
      reminderOffset: prefs.reminder_offset_default ?? 15,
      language: prefs.language ?? 'en-US',
    });
  },
}));

export default useSettingsStore;
