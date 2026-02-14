import { useState } from 'react';
import { TableHead } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTableHead({
  children,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = currentSort === sortKey;

  return (
    <TableHead className={cn('cursor-pointer select-none hover:text-foreground transition-colors', className)}>
      <button
        type="button"
        className="flex items-center gap-1 w-full"
        onClick={() => onSort(sortKey)}
      >
        <span>{children}</span>
        {isActive && currentDirection === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5 shrink-0" />
        ) : isActive && currentDirection === 'desc' ? (
          <ArrowDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

/** Hook for managing sort state: cycles null → asc → desc → null */
export function useTableSort(defaultKey: string | null = null, defaultDir: SortDirection = null) {
  const [sortKey, setSortKey] = useState<string | null>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultDir);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  return { sortKey, sortDir, handleSort };
}

/** Generic comparator for sorting arrays */
export function sortItems<T>(
  items: T[],
  sortKey: string | null,
  sortDir: SortDirection,
  getters: Record<string, (item: T) => string | number | null | undefined>,
): T[] {
  if (!sortKey || !sortDir || !getters[sortKey]) return items;
  const getter = getters[sortKey];
  return [...items].sort((a, b) => {
    const va = getter(a);
    const vb = getter(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = typeof va === 'string' && typeof vb === 'string'
      ? va.localeCompare(vb, 'es')
      : (va as number) - (vb as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });
}
