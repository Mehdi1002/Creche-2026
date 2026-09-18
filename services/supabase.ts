import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Child, Payment, PaymentHistory, CrecheSettings } from '../types';
import { localStore } from './storage';

/**
 * CONFIGURATION SUPABASE
 */
const supabaseUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 'https://fmwdzirsulquspilhtyp.supabase.co'; 
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtd2R6aXJzdWxxdXNwaWxodHlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzYxMjA2MCwiZXhwIjoyMDgzMTg4MDYwfQ.dRoNFaEMpWa9oQasF09zaOJSRcH9rdAmAxy4mfV826E'; 

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');

export const supabase: SupabaseClient | null = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { 'x-application-name': 'creche-manager' }
      }
    })
  : null;

// Empêche les requêtes de bloquer l'interface indéfiniment
const withTimeout = <T>(promise: PromiseLike<T>, timeoutMs = 3500): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout de connexion après ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const dbService = {
  // Récupérer les enfants avec fallback ultra-rapide sur le cache
  async getChildren(): Promise<Child[]> {
    const cached = localStore.getChildren();
    if (!supabase) return cached;
    
    try {
      const response = await withTimeout(
        supabase
          .from('children')
          .select('*')
          .order('nom', { ascending: true })
      );
      
      const { data, error } = response as any;
      if (error) {
        if (error.code === 'PGRST205') return cached;
        console.warn("Supabase notice:", error.message);
        return cached;
      }
      
      if (Array.isArray(data) && data.length > 0) {
        const formatted: Child[] = data.map((row: any) => ({
          id: String(row.id),
          nom: String(row.nom || ''),
          prenom: String(row.prenom || ''),
          dateNaissance: String(row.date_naissance || ''),
          dateInscription: String(row.date_inscription || ''),
          sexe: row.sexe,
          section: row.section,
          nomPere: String(row.nom_pere || ''),
          nomMere: String(row.nom_mere || ''),
          numPere: String(row.num_pere || ''),
          numMere: String(row.num_mere || '')
        }));
        localStore.setChildren(formatted);
        return formatted;
      }
      return cached;
    } catch (e) {
      console.warn("Utilisation du cache local pour les enfants (connexion différée):", e);
      return cached;
    }
  },

  async upsertChild(child: Child): Promise<void> {
    // 1. Sauvegarde locale immédiate (0ms)
    const current = localStore.getChildren();
    const index = current.findIndex(c => String(c.id) === String(child.id));
    if (index >= 0) {
      current[index] = child;
    } else {
      current.push(child);
    }
    localStore.setChildren(current);

    // 2. Synchronisation Supabase en arrière-plan sans bloquer
    if (!supabase) return;
    try {
      const payload = {
        id: child.id,
        nom: child.nom,
        prenom: child.prenom,
        date_naissance: child.dateNaissance,
        date_inscription: child.dateInscription,
        sexe: child.sexe,
        section: child.section,
        nom_pere: child.nomPere,
        nom_mere: child.nomMere,
        num_pere: child.numPere,
        num_mere: child.numMere
      };

      await withTimeout(
        supabase.from('children').upsert(payload)
      );
    } catch (e) {
      console.warn("Synchronisation Supabase différée pour l'enfant:", e);
    }
  },

  async deleteChild(id: string): Promise<void> {
    // 1. Suppression locale immédiate
    const current = localStore.getChildren().filter(c => String(c.id) !== String(id));
    localStore.setChildren(current);

    // 2. Synchronisation Supabase
    if (!supabase) return;
    try {
      await withTimeout(
        supabase.from('children').delete().eq('id', id)
      );
    } catch (e) {
      console.warn("Synchronisation Supabase différée pour la suppression:", e);
    }
  },

  // Récupérer les paiements avec fallback
  async getPayments(): Promise<PaymentHistory> {
    const cached = localStore.getPayments();
    if (!supabase) return cached;

    try {
      const response = await withTimeout(
        supabase.from('payments').select('*')
      );
      
      const { data, error } = response as any;
      if (error) {
        if (error.code === 'PGRST205') return cached;
        console.warn("Supabase notice:", error.message);
        return cached;
      }

      if (Array.isArray(data) && data.length > 0) {
        const history: PaymentHistory = {};
        data.forEach((row: any) => {
          const childId = String(row.child_id);
          const year = Number(row.year);
          const month = Number(row.month);
          if (!history[childId]) history[childId] = {};
          if (!history[childId][year]) history[childId][year] = {};
          
          history[childId][year][month] = {
            childId,
            year,
            month,
            amountPaid: Number(row.amount_paid),
            paymentDate: String(row.payment_date)
          };
        });
        localStore.setPayments(history);
        return history;
      }
      return cached;
    } catch (e) {
      console.warn("Utilisation du cache local pour les paiements:", e);
      return cached;
    }
  },

  async upsertPayment(payment: Payment): Promise<void> {
    // 1. Sauvegarde locale immédiate
    const history = localStore.getPayments();
    if (!history[payment.childId]) history[payment.childId] = {};
    if (!history[payment.childId][payment.year]) history[payment.childId][payment.year] = {};
    history[payment.childId][payment.year][payment.month] = payment;
    localStore.setPayments(history);

    // 2. Synchronisation Supabase
    if (!supabase) return;
    try {
      const payload = {
        child_id: payment.childId,
        year: payment.year,
        month: payment.month,
        amount_paid: payment.amountPaid,
        payment_date: payment.paymentDate
      };

      await withTimeout(
        supabase.from('payments').upsert(payload, { onConflict: 'child_id,year,month' })
      );
    } catch (e) {
      console.warn("Synchronisation Supabase différée pour le versement:", e);
    }
  },

  async deletePayment(childId: string, year: number, month: number): Promise<void> {
    // 1. Suppression locale immédiate
    const history = localStore.getPayments();
    if (history[childId]?.[year]?.[month]) {
      delete history[childId][year][month];
      localStore.setPayments(history);
    }

    // 2. Synchronisation Supabase
    if (!supabase) return;
    try {
      await withTimeout(
        supabase.from('payments').delete().match({ child_id: childId, year, month })
      );
    } catch (e) {
      console.warn("Synchronisation Supabase différée pour la suppression paiement:", e);
    }
  },

  // Paramètres
  async getSettings(): Promise<CrecheSettings | null> {
    const cached = localStore.getSettings();
    if (!supabase) return cached;

    try {
      const response = await withTimeout(
        supabase.from('settings').select('*').limit(1).maybeSingle()
      );
      
      const { data, error } = response as any;
      if (error) {
        if (error.code === 'PGRST205') return cached;
        return cached;
      }
      if (!data) return cached;

      const formatted: CrecheSettings = {
        name: String(data.name || cached.name),
        rc: String(data.rc || cached.rc),
        nif: String(data.nif || cached.nif),
        article: String(data.article || cached.article),
        agrement: String(data.agrement || cached.agrement),
        address: String(data.address || cached.address),
        tel: String(data.tel || cached.tel),
        city: String(data.city || cached.city)
      };
      localStore.setSettings(formatted);
      return formatted;
    } catch (e) {
      console.warn("Utilisation des paramètres locaux:", e);
      return cached;
    }
  },

  async updateSettings(settings: CrecheSettings): Promise<void> {
    localStore.setSettings(settings);
    if (!supabase) return;

    try {
      await withTimeout(
        supabase.from('settings').upsert({ id: 1, ...settings })
      );
    } catch (e) {
      console.warn("Mise à jour Supabase différée pour les paramètres:", e);
    }
  }
};
