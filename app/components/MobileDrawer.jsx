'use client';

import { Calendar, X, ChevronRight } from 'lucide-react';
import { formatDateShort } from '../lib/utils';

export default function MobileDrawer({ isOpen, onClose, allDates, selectedDate, onSelectDate }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end md:hidden">
      <div className="w-64 max-w-xs bg-white dark:bg-slate-900 shadow-xl flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-editorial-accent" />
            <span>历史归档列表</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-1">
          {allDates.map(date => (
            <button
              key={date}
              onClick={() => {
                onSelectDate(date);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all text-left ${
                date === selectedDate
                  ? 'bg-red-50 dark:bg-red-950/20 text-editorial-accent dark:text-red-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 opacity-60" />
                <span>{formatDateShort(date)}</span>
              </div>
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
