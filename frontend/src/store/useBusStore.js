import { create } from 'zustand';

export const useBusStore = create((set) => ({
  selectedLanguage: 'en',
  setLanguage: (lang) => set({ selectedLanguage: lang }),
  routes: [
    {
      id: 'r1',
      code: 'M1',
      name: 'Moga → Dagru',
      status: 'live',
      etaMin: 4,
      etaMax: 6,
      confidence: 92,
    },
    {
      id: 'r2',
      code: 'M2',
      name: 'Moga → Kot Ise Khan',
      status: 'scheduled',
      etaMin: 15,
      etaMax: 20,
      confidence: 40,
    },
    {
      id: 'r3',
      code: 'M3',
      name: 'Moga → Baghapurana',
      status: 'crowd_restored',
      etaMin: 8,
      etaMax: 12,
      confidence: 65,
    },
  ],
}));
