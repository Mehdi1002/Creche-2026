import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Info, Phone } from 'lucide-react';
import { Child, Section, Sexe } from '../types';
import { SECTIONS, GENDERS } from '../constants';

interface ChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (child: Child) => void;
  initialChild?: Child;
}

const ChildModal: React.FC<ChildModalProps> = ({ isOpen, onClose, onSave, initialChild }) => {
  const getToday = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Child>>({
    nom: '',
    prenom: '',
    dateNaissance: '',
    dateInscription: getToday(),
    sexe: Sexe.Garcon,
    section: Section.Petite,
    nomPere: '',
    nomMere: '',
    numPere: '',
    numMere: '',
  });

  useEffect(() => {
    if (initialChild) {
      setFormData(initialChild);
    } else {
      setFormData({
        nom: '',
        prenom: '',
        dateNaissance: '',
        dateInscription: getToday(),
        sexe: Sexe.Garcon,
        section: Section.Petite,
        nomPere: '',
        nomMere: '',
        numPere: '',
        numMere: '',
      });
    }
  }, [initialChild, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    onSave({
      ...formData as Child,
      id: initialChild?.id || generatedId,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 lg:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
        <div className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <User className="w-5 lg:w-6 h-5 lg:h-6" />
            </div>
            <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
              {initialChild ? 'Mise à jour.' : 'Nouvelle Inscription.'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600 p-2 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-5 lg:w-6 h-5 lg:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-4">
            <div className="text-slate-800 font-bold text-[10px] uppercase tracking-[0.15em] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Info className="w-3.5 h-3.5 text-indigo-500" /> Informations.
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom</label>
                <input required name="nom" value={formData.nom} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-semibold text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Prénom</label>
                <input required name="prenom" value={formData.prenom} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-semibold text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Sexe</label>
                <select name="sexe" value={formData.sexe} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-bold text-sm cursor-pointer">
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Section</label>
                <select name="section" value={formData.section} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-bold text-sm cursor-pointer">
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Naissance</label>
                <input required type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-semibold text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Inscription</label>
                <input required type="date" name="dateInscription" value={formData.dateInscription} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none font-semibold text-sm" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="text-slate-800 font-bold text-[10px] uppercase tracking-[0.15em] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Phone className="w-3.5 h-3.5 text-indigo-500" /> Parents.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Père</label>
                <input name="nomPere" value={formData.nomPere} onChange={handleChange} placeholder="Nom Complet"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none text-sm" />
                <input name="numPere" value={formData.numPere} onChange={handleChange} placeholder="Téléphone"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Mère</label>
                <input name="nomMere" value={formData.nomMere} onChange={handleChange} placeholder="Nom Complet"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none text-sm" />
                <input name="numMere" value={formData.numMere} onChange={handleChange} placeholder="Téléphone"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-700 font-extrabold hover:bg-slate-100 rounded-xl transition-all text-xs uppercase tracking-widest">
              Fermer
            </button>
            <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-widest">
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildModal;