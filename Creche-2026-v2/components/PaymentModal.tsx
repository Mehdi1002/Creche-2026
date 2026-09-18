import React, { useState, useEffect } from 'react';
import { X, Wallet, Calendar, Check } from 'lucide-react';
import { Payment, Child } from '../types';
import { CURRENCY, MONTHS } from '../constants';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  child: Child;
  year: number;
  month: number;
  existingPayment?: Payment;
  monthlyFee: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSave, child, year, month, existingPayment, monthlyFee }) => {
  const [amount, setAmount] = useState<number>(monthlyFee);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (existingPayment) {
      setAmount(Number(existingPayment.amountPaid) || 0);
      setDate(String(existingPayment.paymentDate || new Date().toISOString().split('T')[0]));
    } else {
      setAmount(monthlyFee);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [existingPayment, isOpen, monthlyFee]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ childId: String(child.id), year: Number(year), month: Number(month), amountPaid: Math.max(0, Number(amount)), paymentDate: String(date) });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Wallet className="w-5 h-5"/></div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Règlement</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 p-3.5 rounded-xl text-center border border-slate-100">
            <div className="font-black text-indigo-600 text-base">{String(child.prenom)} {String(child.nom)}</div>
            <div className="text-xs text-slate-600 font-bold mt-0.5 uppercase tracking-widest">{String(MONTHS[month])} {Number(year)}</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Montant Versé ({String(CURRENCY)})</label>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setAmount(monthlyFee)} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors">Total ({monthlyFee.toLocaleString()})</button>
                <button type="button" onClick={() => setAmount(monthlyFee / 2)} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded hover:bg-slate-200 transition-colors">50%</button>
              </div>
            </div>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input required type="number" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-black text-slate-900 text-lg" />
            </div>
            <div className="text-[11px] text-slate-500 font-medium italic text-right pr-1">Frais mensuels : {monthlyFee.toLocaleString()} {String(CURRENCY)}</div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Date de versement</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase tracking-wider cursor-pointer">Annuler</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"><Check className="w-4 h-4" /> Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;