import React from 'react';
import { Users, CreditCard, Sparkles, Settings, LayoutDashboard, X } from 'lucide-react';

interface SidebarProps {
  currentPage: 'home' | 'children' | 'payments' | 'profile';
  onPageChange: (page: 'home' | 'children' | 'payments' | 'profile') => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[50] lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-screen w-64 bg-slate-950 text-white flex flex-col z-[60] border-r border-slate-800/50 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 mb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white tracking-tighter">MANAGER</h1>
              <span className="text-[11px] text-indigo-400 font-extrabold uppercase tracking-[0.2em]">Crèche SaaS</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-4 mb-4">Menu Principal</div>
          
          <button
            onClick={() => { onPageChange('home'); onClose?.(); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
              currentPage === 'home' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${currentPage === 'home' ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
            <span className="font-bold text-[15px]">Tableau de bord</span>
          </button>

          <button
            onClick={() => { onPageChange('children'); onClose?.(); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
              currentPage === 'children' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Users className={`w-5 h-5 ${currentPage === 'children' ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
            <span className="font-bold text-[15px]">Gestion Enfants</span>
          </button>

          <button
            onClick={() => { onPageChange('payments'); onClose?.(); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
              currentPage === 'payments' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <CreditCard className={`w-5 h-5 ${currentPage === 'payments' ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
            <span className="font-bold text-[15px]">Suivi Paiements</span>
          </button>

          <button
            onClick={() => { onPageChange('profile'); onClose?.(); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
              currentPage === 'profile' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Settings className={`w-5 h-5 ${currentPage === 'profile' ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
            <span className="font-bold text-[15px]">Profil & Admin</span>
          </button>
        </nav>

        <div className="p-8 border-t border-slate-900">
          <div className="text-center text-[11px] text-slate-600 font-bold uppercase tracking-widest">
            v1.5.0 • PRO VERSION
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;