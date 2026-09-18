import { Child, Payment, PaymentHistory, CrecheSettings } from '../types';
import { localStore } from './storage';

const API_URL = 'http://localhost:3001/api';

export const dbService = {
  async getChildren(): Promise<Child[]> {
    try {
      const res = await fetch(`${API_URL}/children`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      localStore.setChildren(data);
      return data;
    } catch (e) {
      console.warn('Fallback cache local (children):', e);
      return localStore.getChildren();
    }
  },

  async upsertChild(child: Child): Promise<void> {
    // Sauvegarde locale immédiate
    const current = localStore.getChildren();
    const index = current.findIndex(c => String(c.id) === String(child.id));
    if (index >= 0) current[index] = child;
    else current.push(child);
    localStore.setChildren(current);

    try {
      await fetch(`${API_URL}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(child)
      });
    } catch (e) {
      console.warn('Sync différée (upsertChild):', e);
    }
  },

  async deleteChild(id: string): Promise<void> {
    const current = localStore.getChildren().filter(c => String(c.id) !== String(id));
    localStore.setChildren(current);

    try {
      await fetch(`${API_URL}/children/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Sync différée (deleteChild):', e);
    }
  },

  async getPayments(): Promise<PaymentHistory> {
    try {
      const res = await fetch(`${API_URL}/payments`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      localStore.setPayments(data);
      return data;
    } catch (e) {
      console.warn('Fallback cache local (payments):', e);
      return localStore.getPayments();
    }
  },

  async upsertPayment(payment: Payment): Promise<void> {
    const history = localStore.getPayments();
    if (!history[payment.childId]) history[payment.childId] = {};
    if (!history[payment.childId][payment.year]) history[payment.childId][payment.year] = {};
    history[payment.childId][payment.year][payment.month] = payment;
    localStore.setPayments(history);

    try {
      await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment)
      });
    } catch (e) {
      console.warn('Sync différée (upsertPayment):', e);
    }
  },

  async deletePayment(childId: string, year: number, month: number): Promise<void> {
    const history = localStore.getPayments();
    if (history[childId]?.[year]?.[month]) {
      delete history[childId][year][month];
      localStore.setPayments(history);
    }

    try {
      await fetch(`${API_URL}/payments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, year, month })
      });
    } catch (e) {
      console.warn('Sync différée (deletePayment):', e);
    }
  },

  async getSettings(): Promise<CrecheSettings | null> {
    try {
      const res = await fetch(`${API_URL}/settings`);
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      if (data) localStore.setSettings(data);
      return data;
    } catch (e) {
      console.warn('Fallback cache local (settings):', e);
      return localStore.getSettings();
    }
  },

  async updateSettings(settings: CrecheSettings): Promise<void> {
    localStore.setSettings(settings);

    try {
      await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch (e) {
      console.warn('Sync différée (updateSettings):', e);
    }
  }
};
