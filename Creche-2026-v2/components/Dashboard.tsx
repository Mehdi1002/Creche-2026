import React, { useMemo } from 'react';
import { Child, PaymentHistory, Section, Sexe } from '../types';
import { MONTHLY_FEE, CURRENCY, MONTHS } from '../constants';
import { Users, TrendingUp, AlertCircle, PieChart, BarChart3, ArrowUpRight, Layout } from 'lucide-react';

interface DashboardProps {
  children: Child[];
  payments: PaymentHistory;
}

const Dashboard: React.FC<DashboardProps> = ({ children, payments }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const stats = useMemo(() => {
    const totalChildren = children.length;
    
    const sections: Record<string, number> = {
      [Section.Petite]: 0,
      [Section.Moyenne]: 0,
      [Section.Prescolaire]: 0,
    };

    const sexes: Record<string, number> = {
      [Sexe.Garcon]: 0,
      [Sexe.Fille]: 0,
    };

    // Pré-calcul des 6 mois d'historique
    const historyMonths: { year: number; month: number; label: string; key: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(currentYear, currentMonth - (5 - i), 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      historyMonths.push({
        year: y,
        month: m,
        label: String(MONTHS[m] || '').substring(0, 4),
        key: `${y}-${m}`
      });
    }

    const historyTotals: Record<string, number> = {};
    historyMonths.forEach(h => { historyTotals[h.key] = 0; });

    let monthlyPaid = 0;

    // Calcul en une seule passe ultra-rapide O(n)
    for (let i = 0; i < totalChildren; i++) {
      const c = children[i];
      
      // Sections
      if (c.section && sections[c.section] !== undefined) {
        sections[c.section]++;
      } else {
        sections[Section.Petite]++;
      }

      // Sexes
      if (c.sexe && sexes[c.sexe] !== undefined) {
        sexes[c.sexe]++;
      } else {
        sexes[Sexe.Garcon]++;
      }

      // Paiements
      const childPayments = payments[c.id];
      if (childPayments) {
        const currP = childPayments[currentYear]?.[currentMonth];
        if (currP?.amountPaid) {
          monthlyPaid += Number(currP.amountPaid);
        }

        for (let j = 0; j < 6; j++) {
          const hm = historyMonths[j];
          const p = childPayments[hm.year]?.[hm.month];
          if (p?.amountPaid) {
            historyTotals[hm.key] += Number(p.amountPaid);
          }
        }
      }
    }

    const expectedMonthly = totalChildren * MONTHLY_FEE;
    const remainingMonthly = Math.max(0, expectedMonthly - monthlyPaid);

    const historyData = historyMonths.map(hm => ({
      month: hm.label,
      amount: historyTotals[hm.key] || 0,
      key: hm.key
    }));

    return { totalChildren, sections, sexes, monthlyPaid, remainingMonthly, historyData, expectedMonthly };
  }, [children, payments, currentYear, currentMonth]);

  const maxHistoryAmount = useMemo(() => {
    return Math.max(...stats.historyData.map(d => Number(d.amount)), 1);
  }, [stats.historyData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tableau de Bord</h2>
        <p className="text-slate-600 font-medium mt-1">Activité en direct - {String(MONTHS[currentMonth] || '')} {Number(currentYear)}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600"><Users className="w-6 h-6"/></div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              Actifs <ArrowUpRight className="w-3 h-3"/>
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{Number(stats.totalChildren)}</div>
          <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Enfants inscrits</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600"><TrendingUp className="w-6 h-6"/></div>
          </div>
          <div className="text-3xl font-black text-slate-900">{Number(stats.monthlyPaid).toLocaleString()} <span className="text-lg font-bold text-slate-400">{String(CURRENCY)}</span></div>
          <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Encaissé ce mois</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600"><AlertCircle className="w-6 h-6"/></div>
          </div>
          <div className="text-3xl font-black text-slate-900">{Number(stats.remainingMonthly).toLocaleString()} <span className="text-lg font-bold text-slate-400">{String(CURRENCY)}</span></div>
          <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Reste à percevoir</div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-950/20 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-slate-800 p-2.5 rounded-xl text-indigo-400"><BarChart3 className="w-6 h-6"/></div>
          </div>
          <div className="text-3xl font-black">{Number(stats.expectedMonthly).toLocaleString()} <span className="text-lg font-bold text-slate-400">{String(CURRENCY)}</span></div>
          <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">Objectif Mensuel</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600"/> Historique des Encaissements
            </h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">6 derniers mois</span>
          </div>
          
          <div className="flex items-end justify-between h-56 gap-4 px-2">
            {stats.historyData.map((data) => (
              <div key={data.key} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex flex-col items-center">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap font-bold pointer-events-none z-10 shadow-lg">
                    {Number(data.amount).toLocaleString()} DA
                  </div>
                  <div 
                    className="w-full max-w-[48px] bg-indigo-500 rounded-t-xl transition-all duration-300 hover:bg-indigo-600 cursor-help"
                    style={{ height: `${(Number(data.amount) / maxHistoryAmount) * 100}%`, minHeight: '6px' }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-tighter">{String(data.month)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-8 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600"/> Répartition Sexe
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-sky-600">Garçons</span>
                  <span className="text-slate-900">{Number(stats.sexes[Sexe.Garcon] || 0)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${((Number(stats.sexes[Sexe.Garcon]) || 0) / (stats.totalChildren || 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-rose-600">Filles</span>
                  <span className="text-slate-900">{Number(stats.sexes[Sexe.Fille] || 0)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${((Number(stats.sexes[Sexe.Fille]) || 0) / (stats.totalChildren || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-8 flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-600"/> Sections
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.sections).map(([sectionName, count]) => (
                <div key={String(sectionName)} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{String(sectionName)}</span>
                    <span className="text-lg font-black text-slate-900">{Number(count)}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                    String(sectionName) === String(Section.Petite) ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    String(sectionName) === String(Section.Moyenne) ? 'bg-sky-50 border-sky-100 text-sky-600' :
                    'bg-violet-50 border-violet-100 text-violet-600'
                  }`}>
                    {Math.round((Number(count) / (stats.totalChildren || 1)) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
