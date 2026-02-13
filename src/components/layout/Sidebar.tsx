import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { 
  Calendar, 
  BarChart3,
  MapPin,
  Truck,
  Bot,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Eventos',
    href: '/events',
    icon: Calendar,
  },
  {
    title: 'Sedes',
    href: '/venues',
    icon: MapPin,
    roles: ['manager', 'admin'],
  },
  {
    title: 'Proveedores e Insumos',
    href: '/suppliers',
    icon: Truck,
  },
  {
    title: 'Reportes',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Asistente IA',
    href: '/assistant',
    icon: Bot,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);

            const linkContent = (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </TooltipProvider>
      </nav>
      {/* Collapse toggle */}
      <div className={cn('border-t p-2', collapsed ? 'flex justify-center' : '')}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'text-muted-foreground hover:text-foreground',
            collapsed ? 'h-9 w-9 p-0' : 'w-full justify-start gap-2'
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span className="text-xs">Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
