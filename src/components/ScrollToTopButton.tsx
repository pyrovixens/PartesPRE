import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 sm:bottom-6 right-6 z-40 bg-slate-900/90 hover:bg-red-700 text-white dark:bg-slate-800/90 dark:hover:bg-red-700 p-3 rounded-2xl shadow-2xl border border-slate-700/80 dark:border-slate-600/80 backdrop-blur-md transition-all duration-300 transform active:scale-90 hover:-translate-y-1 flex items-center space-x-1.5 group animate-in fade-in zoom-in-90 duration-200"
      title="Subir al principio de la página"
      aria-label="Subir al principio"
    >
      <ArrowUp className="w-4 h-4 text-amber-400 group-hover:text-white transition group-hover:-translate-y-0.5" />
      <span className="text-[11px] font-black hidden sm:inline tracking-tight">Subir</span>
    </button>
  );
};
