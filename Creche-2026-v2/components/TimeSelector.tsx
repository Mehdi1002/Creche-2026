import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS } from '../constants';

interface TimeSelectorProps {
  currentYear: number;
  currentMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({ 
  currentYear, 
  currentMonth, 
  onYearChange, 
  onMonthChange 
}) => {
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11);
      onYearChange(currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0);
      onYearChange(currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shadow-sm">
      <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 rounded text-slate-500 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="min-w-[120px] text-center text-sm font-bold text-slate-800">
        {String(MONTHS[currentMonth])} {Number(currentYear)}
      </div>

      <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-50 rounded text-slate-500 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-slate-200 mx-1"></div>

      <select
        value={currentYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="bg-white text-xs font-bold text-slate-600 outline-none cursor-pointer px-1 border-none focus:ring-0"
      >
        {years.map(y => <option key={Number(y)} value={Number(y)}>{Number(y)}</option>)}
      </select>
    </div>
  );
};

export default TimeSelector;