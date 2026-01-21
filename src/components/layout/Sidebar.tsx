import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { 
  Calendar, 
  LayoutGrid, 
  BarChart3,
  MapPin,
  Truck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Events',
    href: '/events',
    icon: Calendar,
  },
  {
    title: 'Venues',
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
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
