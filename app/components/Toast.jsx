'use client';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg z-50 border border-slate-700 flex items-center space-x-2 animate-bounce">
      <span className="text-emerald-500">✔</span>
      <span>{message}</span>
    </div>
  );
}
