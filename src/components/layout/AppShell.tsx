import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { RuntimeErrorOverlay } from '@/components/RuntimeErrorOverlay';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AssistantBubble } from '@/components/assistant/AssistantBubble';
import { cn } from '@/lib/utils/cn';

const SIDEBAR_WIDTH = 256; // 16rem = w-64
const SIDEBAR_COLLAPSED_WIDTH = 60; // ~icon + padding

export function AppShell() {
  const { isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="h-14 border-b" />
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div className="min-h-screen flex flex-col">
      <RuntimeErrorOverlay />
      <Topbar />
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden md:flex md:flex-col md:fixed md:inset-y-0 md:pt-14 md:border-r bg-background transition-[width] duration-200 ease-in-out'
          )}
          style={{ width: sidebarWidth }}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </aside>
        {/* Main Content */}
        <main
          className="flex-1 transition-[margin-left] duration-200 ease-in-out"
          style={{ marginLeft: `var(--sidebar-width, 0px)` }}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        {/* CSS variable for responsive margin - only on md+ */}
        <style>{`
          @media (min-width: 768px) {
            main { --sidebar-width: ${sidebarWidth}px; }
          }
        `}</style>
      </div>
      <AssistantBubble />
    </div>
  );
}
