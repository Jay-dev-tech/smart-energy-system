
'use client';

import { Dashboard } from '../../components/dashboard/dashboard';
import { Header } from '../../components/header';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../../components/ui/sidebar';
import { LineChart, History, Settings } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive>
              <Link href="/home">
                <LineChart />
                Prediction
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/history">
                <History />
                History
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
               <Link href="/settings">
                <Settings />
                Setting
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Dashboard />
        </main>
      </div>
    </SidebarProvider>
  );
}
