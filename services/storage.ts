import { Child, Payment, PaymentHistory, CrecheSettings } from '../types';
import { CRECHE_INFO } from '../constants';

const STORAGE_KEYS = {
  CHILDREN: 'creche_manager_children',
  PAYMENTS: 'creche_manager_payments',
  SETTINGS: 'creche_manager_settings'
};

export const localStore = {
  getChildren(): Child[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHILDREN);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Erreur lecture cache local enfants:", e);
      return [];
    }
  },

  setChildren(children: Child[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
    } catch (e) {
      console.warn("Erreur sauvegarde cache local enfants:", e);
    }
  },

  getPayments(): PaymentHistory {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn("Erreur lecture cache local paiements:", e);
      return {};
    }
  },

  setPayments(payments: PaymentHistory): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.warn("Erreur sauvegarde cache local paiements:", e);
    }
  },

  getSettings(): CrecheSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : CRECHE_INFO;
    } catch (e) {
      console.warn("Erreur lecture cache local paramètres:", e);
      return CRECHE_INFO;
    }
  },

  setSettings(settings: CrecheSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn("Erreur sauvegarde cache local paramètres:", e);
    }
  }
};
