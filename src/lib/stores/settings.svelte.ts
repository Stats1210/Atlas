import { getSettings, saveSettings, type AppSettings } from '$lib/db';

class SettingsStore {
  data = $state<AppSettings | null>(null);

  get loaded(): boolean { return this.data !== null; }

  async load() {
    this.data = await getSettings();
  }

  async set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (!this.data) return;
    (this.data as AppSettings)[key] = value;
    await saveSettings({ [key]: value });
  }

  async update(patch: Partial<AppSettings>) {
    if (!this.data) return;
    Object.assign(this.data, patch);
    await saveSettings(patch);
  }

  get unit(): 'kg' | 'lbs' {
    return this.data?.unit_weight ?? 'kg';
  }

  get distUnit(): 'km' | 'mi' {
    return this.data?.unit_distance ?? 'km';
  }

  get formula(): 'epley' | 'brzycki' {
    return this.data?.e1rm_formula ?? 'epley';
  }

  get increment(): number {
    return this.data?.default_increment_kg ?? 2.5;
  }

  get barWeight(): number {
    return this.data?.default_bar_weight_kg ?? 20;
  }

  get restSec(): number {
    return this.data?.default_rest_sec ?? 180;
  }

  get rpeEnabled(): boolean {
    return this.data?.rpe_enabled ?? true;
  }

  get hrMax(): number {
    return this.data?.hr_max_bpm ?? 190;
  }
}

export const settings = new SettingsStore();
