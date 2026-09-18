import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChildModal from './components/ChildModal';
import PaymentModal from './components/PaymentModal';
import TimeSelector from './components/TimeSelector';
import Dashboard from './components/Dashboard';
import { Child, Payment, PaymentHistory, Sexe, Section, CrecheSettings } from './types';
import { dbService } from './services/api';
import { localStore } from './services/storage';
import { MONTHLY_FEE, CURRENCY, CRECHE_INFO, MONTHS } from './constants';
import { Plus, Edit2, Trash2, Search, X, Loader2, History, Menu, Upload, FileText, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'children' | 'payments' | 'profile'>('home');
  
  const [children, setChildren] = useState<Child[]>(() => localStore.getChildren());
  const [payments, setPayments] = useState<PaymentHistory>(() => localStore.getPayments());
  const [crecheSettings, setCrecheSettings] = useState<CrecheSettings>(() => localStore.getSettings());
  
  const [isLoading, setIsLoading] = useState<boolean>(() => children.length === 0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('Toutes');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');

  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | undefined>();
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentChild, setPaymentChild] = useState<Child | undefined>();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<{childId: string, year: number, month: number} | null>(null);
  const [historyChildId, setHistoryChildId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Montant mensuel dynamique depuis les paramètres
  const currentFee = crecheSettings.monthlyFee || MONTHLY_FEE;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const newToast = { id: Date.now(), message, type };
    setToast(newToast);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const syncBackgroundData = useCallback(async () => {
    try {
      const [fetchedChildren, fetchedPayments, fetchedSettings] = await Promise.all([
        dbService.getChildren(),
        dbService.getPayments(),
        dbService.getSettings()
      ]);
      if (fetchedChildren && fetchedChildren.length > 0) {
        setChildren(fetchedChildren);
      }
      if (fetchedPayments && Object.keys(fetchedPayments).length > 0) {
        setPayments(fetchedPayments);
      }
      if (fetchedSettings) {
        setCrecheSettings(fetchedSettings);
      }
    } catch (err) {
      console.warn("Synchronisation distante terminée avec données locales actives:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncBackgroundData();
  }, [syncBackgroundData]);

  const getPaymentStatus = useCallback((childId: string, year: number, month: number) => {
    const p = payments[childId]?.[year]?.[month];
    if (!p) return { status: 'Non payé', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
    if (Number(p.amountPaid) >= currentFee) return { status: 'Payé', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    return { status: 'Reste à payer', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
  }, [payments, currentFee]);

  const filteredChildren = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return children.filter(child => {
      const nom = String(child.nom || '').toLowerCase();
      const prenom = String(child.prenom || '').toLowerCase();
      const matchesSearch = !query || nom.includes(query) || prenom.includes(query) || `${nom} ${prenom}`.includes(query);
      const matchesSection = sectionFilter === 'Toutes' || String(child.section) === sectionFilter;
      
      let matchesStatus = true;
      if (currentPage === 'payments' && statusFilter !== 'Tous') {
        const pInfo = getPaymentStatus(child.id, selectedYear, selectedMonth);
        matchesStatus = pInfo.status === statusFilter;
      }
      return matchesSearch && matchesSection && matchesStatus;
    });
  }, [children, searchQuery, sectionFilter, statusFilter, currentPage, getPaymentStatus, selectedYear, selectedMonth]);

  const handleGenerateCertificate = (child: Child) => {
    try {
      const doc = new jsPDF();
      
      const today = new Date().toLocaleDateString('fr-FR');
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const academicYear = currentMonth >= 8 
        ? `${currentYear}-${currentYear + 1}` 
        : `${currentYear - 1}-${currentYear}`;

      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`${crecheSettings.city || 'Alger'} le ${today}`, pageWidth - margin, 15, { align: 'right' });

      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text((crecheSettings.name || CRECHE_INFO.name).toUpperCase(), pageWidth / 2, 38, { align: 'center' });

      let yPos = 58;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`"${(crecheSettings.name || CRECHE_INFO.name).toUpperCase()}"`, margin, yPos);
      yPos += 7;
      doc.text(`RC : ${crecheSettings.rc || CRECHE_INFO.rc}`, margin, yPos);
      yPos += 7;
      doc.text(`NIF : ${crecheSettings.nif || CRECHE_INFO.nif}`, margin, yPos);
      yPos += 7;
      doc.text(`ARTICLE : ${crecheSettings.article || CRECHE_INFO.article}`, margin, yPos);
      yPos += 7;
      doc.text(`Agrément N° : ${crecheSettings.agrement || CRECHE_INFO.agrement}`, margin, yPos);
      yPos += 7;
      doc.text(crecheSettings.address || CRECHE_INFO.address, margin, yPos);
      yPos += 7;
      doc.text(`TEL : ${crecheSettings.tel || CRECHE_INFO.tel}`, margin, yPos);

      yPos = 125;
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text("Certificat de scolarité", pageWidth / 2, yPos, { align: 'center' });

      yPos = 155;
      doc.setFontSize(15);
      doc.setFont('helvetica', 'normal');
      
      const isFille = child.sexe === Sexe.Fille;
      const neeStr = isFille ? 'née' : 'né';
      const inscriteStr = isFille ? 'inscrite' : 'inscrit';
      const dateNaiss = child.dateNaissance ? new Date(child.dateNaissance).toLocaleDateString('fr-FR') : 'inconnue';
      
      const sectionDisplay = child.section === Section.Prescolaire 
        ? child.section.toLowerCase() 
        : `${String(child.section || '').toLowerCase()} section`;
      
      const bodyText = `Je soussigné, Monsieur le Directeur de la ${crecheSettings.name || CRECHE_INFO.name}, atteste que l'élève ${(child.prenom || '').toUpperCase()} ${(child.nom || '').toUpperCase()}, ${neeStr} le ${dateNaiss}, est ${inscriteStr} au sein de notre établissement en ${sectionDisplay} pour l'année scolaire ${academicYear}.`;

      const splitText = doc.splitTextToSize(bodyText, contentWidth);
      doc.text(splitText, margin, yPos, { lineHeightFactor: 1.6 });

      yPos += 45;
      doc.text("Cette attestation est faite pour servir et valoir ce que de droit.", margin, yPos);

      yPos += 25;
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text("Le directeur", pageWidth - margin - 10, yPos, { align: 'right' });

      doc.save(`Certificat_${child.nom}_${child.prenom}.pdf`);
      showToast(`Certificat pour ${child.prenom} généré et téléchargé`, 'success');
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la génération du certificat PDF", 'error');
    }
  };

  const handleSaveChild = async (child: Child) => {
    setChildren(prev => {
      const idx = prev.findIndex(c => c.id === child.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = child;
        return copy;
      }
      return [...prev, child];
    });
    setIsChildModalOpen(false);
    setEditingChild(undefined);
    showToast(editingChild ? "Enfant mis à jour avec succès" : "Nouvel enfant inscrit", 'success');

    dbService.upsertChild(child).catch(err => {
      console.warn("Échec synchronisation enfant:", err);
    });
  };

  const handleConfirmDeleteChild = async (id: string) => {
    setChildren(prev => prev.filter(c => c.id !== id));
    setConfirmDeleteId(null);
    showToast("Dossier supprimé", 'info');

    dbService.deleteChild(id).catch(err => {
      console.warn("Échec suppression enfant:", err);
    });
  };

  const handleSavePayment = async (payment: Payment) => {
    setPayments(prev => ({
      ...prev,
      [payment.childId]: {
        ...(prev[payment.childId] || {}),
        [payment.year]: {
          ...(prev[payment.childId]?.[payment.year] || {}),
          [payment.month]: payment
        }
      }
    }));
    setIsPaymentModalOpen(false);
    setPaymentChild(undefined);
    showToast("Paiement enregistré avec succès", 'success');

    dbService.upsertPayment(payment).catch(err => {
      console.warn("Échec synchronisation paiement:", err);
    });
  };

  const handleDeletePayment = async (childId: string, year: number, month: number) => {
    setPayments(prev => {
      const copy = { ...prev };
      if (copy[childId]?.[year]?.[month]) {
        const yearObj = { ...copy[childId][year] };
        delete yearObj[month];
        copy[childId] = { ...copy[childId], [year]: yearObj };
      }
      return copy;
    });
    setConfirmDeletePayment(null);
    showToast("Versement annulé", 'info');

    dbService.deletePayment(childId, year, month).catch(err => {
      console.warn("Échec suppression versement:", err);
    });
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    localStore.setSettings(crecheSettings);
    showToast("Paramètres enregistrés avec succès", 'success');

    try {
      await dbService.updateSettings(crecheSettings);
    } catch (err: any) {
      console.warn("Erreur synchronisation paramètres:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const parseCSVDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    return dateStr;
  };

  const mapSection = (val: string): Section => {
    const v = (val || '').toLowerCase();
    if (v.includes('petit')) return Section.Petite;
    if (v.includes('moyen')) return Section.Moyenne;
    if (v.includes('prescolaire') || v.includes('préscolaire')) return Section.Prescolaire;
    return Section.Petite;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          showToast("Le fichier CSV est vide ou mal formaté.", 'error');
          setIsImporting(false);
          return;
        }

        const headers = lines[0].toLowerCase().split(/[;,]/).map(h => h.trim().replace(/^"|"$/g, ''));
        const idxNom = headers.indexOf('nom');
        const idxPrenom = headers.indexOf('prenom');
        const idxDate = headers.findIndex(h => h.includes('date') && h.includes('naissance'));
        const idxSection = headers.indexOf('section');

        if (idxNom === -1 || idxPrenom === -1) {
          showToast("Colonnes requises manquantes : 'nom' et 'prenom'.", 'error');
          setIsImporting(false);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const newChildren: Child[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/[;,]/).map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 2 || !cols[idxNom]) continue;

          const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : `import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          newChildren.push({
            id: generatedId,
            nom: cols[idxNom],
            prenom: idxPrenom !== -1 ? cols[idxPrenom] : '',
            dateNaissance: idxDate !== -1 ? parseCSVDate(cols[idxDate]) : today,
            dateInscription: today,
            sexe: Sexe.Garcon,
            section: idxSection !== -1 ? mapSection(cols[idxSection]) : Section.Petite,
            nomPere: '',
            nomMere: '',
            numPere: '',
            numMere: ''
          });
        }

        if (newChildren.length === 0) {
          showToast("Aucun enfant valide trouvé dans le fichier.", 'error');
          setIsImporting(false);
          return;
        }

        setChildren(prev => [...prev, ...newChildren]);
        localStore.setChildren([...children, ...newChildren]);
        showToast(`${newChildren.length} enfants importés avec succès !`, 'success');

        Promise.all(newChildren.map(c => dbService.upsertChild(c))).catch(err => {
          console.warn("Synchronisation background partielle:", err);
        });
      } catch (err) {
        console.error(err);
        showToast("Erreur lors de la lecture du fichier CSV.", 'error');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const getChildById = useCallback((id: string | null) => {
    if (!id) return undefined;
    return children.find(c => String(c.id) === String(id));
  }, [children]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 overflow-x-hidden antialiased">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-200">
        {/* Mobile Navbar */}
        <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-30">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="bg-indigo-600 p-2 rounded-lg text-white hover:bg-indigo-700 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-black text-slate-900 tracking-tighter uppercase text-sm">CrècheManager</span>
          </div>
          {currentPage === 'children' && (
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100 transition-colors"
                disabled={isImporting}
                title="Importer CSV"
              >
                {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => { setEditingChild(undefined); setIsChildModalOpen(true); }} 
                className="bg-indigo-600 text-white p-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                title="Ajouter un enfant"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[120] flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-5 duration-200 max-w-md">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Chargement de vos données...</p>
          </div>
        ) : currentPage === 'home' ? (
          <Dashboard children={children} payments={payments} />
        ) : (currentPage === 'children' || currentPage === 'payments') ? (
          <>
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {currentPage === 'children' ? 'Gestion des Enfants' : 'Suivi des Paiements'}
                </h2>
                <p className="text-slate-600 font-medium mt-1">
                  {filteredChildren.length} enfant(s) affiché(s) sur {children.length} au total.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                {currentPage === 'payments' && (
                  <TimeSelector 
                    currentYear={selectedYear} 
                    currentMonth={selectedMonth} 
                    onYearChange={setSelectedYear} 
                    onMonthChange={setSelectedMonth} 
                  />
                )}
                {currentPage === 'children' && (
                  <div className="flex gap-3">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".csv" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isImporting}
                      className="hidden lg:flex bg-white text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-lg font-bold shadow-sm items-center gap-2 hover:bg-indigo-50 transition-colors text-sm"
                    >
                      {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Importer CSV
                    </button>
                    <button 
                      onClick={() => { setEditingChild(undefined); setIsChildModalOpen(true); }} 
                      className="hidden lg:flex bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md items-center gap-2 hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Plus className="w-5 h-5" /> Nouvel Enfant
                    </button>
                  </div>
                )}
              </div>
            </header>

            <div className="mb-6 flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Rechercher par nom ou prénom..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full pl-12 pr-4 py-2.5 border border-slate-200 bg-white rounded-lg outline-none focus:border-indigo-500 text-slate-900 font-medium" 
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <select 
                  value={sectionFilter} 
                  onChange={(e) => setSectionFilter(e.target.value)} 
                  className="flex-1 md:flex-none bg-white text-xs font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 whitespace-nowrap cursor-pointer outline-none focus:border-indigo-500"
                >
                  <option value="Toutes">Toutes Sections</option>
                  {Object.values(Section).map(s => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                </select>
                {currentPage === 'payments' && (
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    className="flex-1 md:flex-none bg-white text-xs font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 whitespace-nowrap cursor-pointer outline-none focus:border-indigo-500"
                  >
                    <option value="Tous">Tous statuts</option>
                    <option value="Payé">Payé</option>
                    <option value="Reste à payer">Reste à payer</option>
                    <option value="Non payé">Non payé</option>
                  </select>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Enfant</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Section</th>
                      {currentPage === 'payments' && (
                        <>
                          <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Statut</th>
                          <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Versements</th>
                          <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Reste</th>
                        </>
                      )}
                      <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredChildren.length === 0 ? (
                      <tr>
                        <td colSpan={currentPage === 'payments' ? 6 : 3} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                          Aucun enfant correspondant aux critères.
                        </td>
                      </tr>
                    ) : (
                      filteredChildren.map(child => {
                        const pInfo = getPaymentStatus(child.id, selectedYear, selectedMonth);
                        const p = payments[child.id]?.[selectedYear]?.[selectedMonth];
                        const reste = p ? Math.max(0, currentFee - Number(p.amountPaid)) : currentFee;

                        return (
                          <tr key={String(child.id)} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{String(child.nom)} {String(child.prenom)}</div>
                              <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{String(child.sexe)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-slate-100 border-slate-200 text-slate-700">
                                {String(child.section)}
                              </span>
                            </td>
                            {currentPage === 'payments' && (
                              <>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${String(pInfo.bg)} ${String(pInfo.color)} ${String(pInfo.border)}`}>
                                    {String(pInfo.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {p ? (
                                    <div>
                                      <div className="font-black text-slate-900 text-xs">{Number(p.amountPaid).toLocaleString()} {String(CURRENCY)}</div>
                                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                        le {new Date(p.paymentDate).toLocaleDateString('fr-FR')}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 italic text-[10px] font-medium uppercase">Aucun versement</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <div className={`font-black text-xs ${reste > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                    {reste.toLocaleString()} {String(CURRENCY)}
                                  </div>
                                </td>
                              </>
                            )}
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5 items-center">
                                {currentPage === 'children' ? (
                                  <>
                                    <button 
                                      onClick={() => handleGenerateCertificate(child)} 
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                      title="Télécharger certificat de scolarité"
                                    >
                                      <FileText className="w-5 h-5"/>
                                    </button>
                                    <button 
                                      onClick={() => { setEditingChild(child); setIsChildModalOpen(true); }} 
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                      title="Modifier"
                                    >
                                      <Edit2 className="w-5 h-5"/>
                                    </button>
                                    <button 
                                      onClick={() => setConfirmDeleteId(child.id)} 
                                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-5 h-5"/>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => setHistoryChildId(child.id)} 
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                      title="Historique des paiements"
                                    >
                                      <History className="w-5 h-5"/>
                                    </button>
                                    {p && (
                                      <button 
                                        onClick={() => setConfirmDeletePayment({ childId: child.id, year: selectedYear, month: selectedMonth })} 
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                                        title="Annuler versement"
                                      >
                                        <Trash2 className="w-5 h-5"/>
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => { setPaymentChild(child); setIsPaymentModalOpen(true); }} 
                                      className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ml-1"
                                    >
                                      Régler
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Profil & Admin</h2>
              <p className="text-slate-600 font-medium mt-1">Coordonnées et mentions légales pour les documents officiels.</p>
            </header>
            <form onSubmit={handleUpdateSettings} className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Nom de la Crèche</label>
                  <input required type="text" value={String(crecheSettings.name || '')} onChange={(e) => setCrecheSettings({...crecheSettings, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 bg-white outline-none font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">RC</label>
                  <input required type="text" value={String(crecheSettings.rc || '')} onChange={(e) => setCrecheSettings({...crecheSettings, rc: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:border-indigo-500 outline-none font-semibold text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">NIF</label>
                  <input required type="text" value={String(crecheSettings.nif || '')} onChange={(e) => setCrecheSettings({...crecheSettings, nif: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:border-indigo-500 outline-none font-semibold text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Article</label>
                  <input required type="text" value={String(crecheSettings.article || '')} onChange={(e) => setCrecheSettings({...crecheSettings, article: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:border-indigo-500 outline-none font-semibold text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Agrément</label>
                  <input required type="text" value={String(crecheSettings.agrement || '')} onChange={(e) => setCrecheSettings({...crecheSettings, agrement: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:border-indigo-500 outline-none font-semibold text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Frais Mensuels (DA)</label>
                  <input required type="number" value={crecheSettings.monthlyFee || 10000} onChange={(e) => setCrecheSettings({...crecheSettings, monthlyFee: Number(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:border-indigo-500 outline-none font-semibold text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Ville</label>
                  <input required type="text" value={String(crecheSettings.city || '')} onChange={(e) => setCrecheSettings({...crecheSettings, city: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:border-indigo-500 outline-none font-semibold text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Téléphone</label>
                  <input required type="text" value={String(crecheSettings.tel || '')} onChange={(e) => setCrecheSettings({...crecheSettings, tel: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:border-indigo-500 outline-none font-semibold text-slate-900" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2 tracking-widest">Adresse</label>
                  <input required type="text" value={String(crecheSettings.address || '')} onChange={(e) => setCrecheSettings({...crecheSettings, address: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:border-indigo-500 outline-none font-semibold text-slate-900" />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSavingSettings} 
                className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
              >
                {isSavingSettings && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer les modifications
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Modals */}
      <ChildModal 
        isOpen={isChildModalOpen} 
        onClose={() => { setIsChildModalOpen(false); setEditingChild(undefined); }} 
        onSave={handleSaveChild} 
        initialChild={editingChild} 
      />

      {isPaymentModalOpen && paymentChild && (
        <PaymentModal 
          isOpen={isPaymentModalOpen} 
          onClose={() => { setIsPaymentModalOpen(false); setPaymentChild(undefined); }} 
          onSave={handleSavePayment} 
          child={paymentChild} 
          year={selectedYear} 
          month={selectedMonth} 
          existingPayment={payments[paymentChild.id]?.[selectedYear]?.[selectedMonth]}
monthlyFee={currentFee} 
        />
      )}
      
      {/* Historique Modal */}
      {historyChildId && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">
                Historique des versements - {String(getChildById(historyChildId)?.prenom || '')} {String(getChildById(historyChildId)?.nom || '')}
              </h3>
              <button 
                onClick={() => setHistoryChildId(null)} 
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b pb-2">
                    <th className="pb-3 text-left">Période</th>
                    <th className="pb-3 text-left">Date</th>
                    <th className="pb-3 text-left">Montant</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(payments[historyChildId] || {}).flatMap(([y, mP]) => 
                    Object.entries(mP).map(([m, p]) => (
                      <tr key={`${String(y)}-${String(m)}`} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-slate-800">{String(MONTHS[parseInt(m)])} {String(y)}</td>
                        <td className="py-3 text-slate-500 text-xs">
                          {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="py-3 font-bold text-indigo-600">{Number(p.amountPaid).toLocaleString()} {CURRENCY}</td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => handleDeletePayment(historyChildId, parseInt(y), parseInt(m))} 
                            className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                            title="Supprimer ce paiement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {(!payments[historyChildId] || Object.keys(payments[historyChildId]).length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        Aucun paiement enregistré pour cet enfant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Child Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-xl mb-2">Confirmer la suppression ?</h3>
            <p className="text-slate-600 mb-6 text-sm font-medium">
              Voulez-vous supprimer définitivement le dossier de cet enfant ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)} 
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleConfirmDeleteChild(confirmDeleteId)} 
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Confirmation Modal */}
      {confirmDeletePayment && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-xl mb-2">Annuler ce versement ?</h3>
            <p className="text-slate-600 mb-6 text-sm font-medium">
              Voulez-vous supprimer ce versement pour le mois sélectionné ?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeletePayment(null)} 
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Conserver
              </button>
              <button 
                onClick={() => handleDeletePayment(confirmDeletePayment.childId, confirmDeletePayment.year, confirmDeletePayment.month)} 
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;