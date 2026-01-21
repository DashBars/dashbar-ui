import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BarType, BarStatus } from '@/lib/api/types';
import { Search } from 'lucide-react';

interface BarsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: BarType | 'all';
  onTypeFilterChange: (value: BarType | 'all') => void;
  statusFilter: BarStatus | 'all';
  onStatusFilterChange: (value: BarStatus | 'all') => void;
}

export function BarsFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
}: BarsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bars..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={typeFilter}
        onValueChange={(value) =>
          onTypeFilterChange(value as BarType | 'all')
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="VIP">VIP</SelectItem>
          <SelectItem value="general">General</SelectItem>
          <SelectItem value="backstage">Backstage</SelectItem>
          <SelectItem value="lounge">Lounge</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          onStatusFilterChange(value as BarStatus | 'all')
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
          <SelectItem value="lowStock">Low Stock</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
