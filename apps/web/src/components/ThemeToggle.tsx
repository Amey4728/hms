import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/theme.store';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition',
        'border-slate-200 bg-white text-slate-500 hover:text-brand-600 hover:border-brand-300',
        'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-brand-300',
        className,
      )}
    >
      <Sun className={cn('h-[18px] w-[18px] transition-all', isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100')} />
      <Moon className={cn('absolute h-[18px] w-[18px] transition-all', isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0')} />
    </button>
  );
}
