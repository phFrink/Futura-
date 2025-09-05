'use client';


import { usePathname } from "next/navigation";

import Link from "next/link";
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  FileText, 
  Wrench, 
  MessageSquare,
  AlertTriangle,
  Megaphone,
  Calendar,
  DollarSign,
  Settings,
  MapPin
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";


const navigationItems = [
  {
    title: "Dashboard",
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: "Properties",
    url: '/properties',
    icon: Home,
  },
  {
    title: "Homeowners", 
    url: '/homeowners',
    icon: Users,
  },
  {
    title: "Billing",
    url: '/billing',
    icon: FileText,
  },
  {
    title: "Service Requests",
    url: '/service-requests',
    icon: Wrench,
  },
  {
    title: "Inquiries",
    url: '/inquiries',
    icon: MessageSquare,
  },
  {
    title: "Complaints",
    url: '/complaints',
    icon: AlertTriangle,
  },
  {
    title: "Announcements",
    url: '/announcements',
    icon: Megaphone,
  },
  {
    title: "Reservations",
    url: '/reservations',
    icon: Calendar,
  },
  {
    title: "Transactions",
    url: '/transactions',
    icon: DollarSign,
  },
  {
    title: "Property Map",
    url: '/property-map',
    icon: MapPin,
  }
];

export default function MainLayout({ children, currentPageName }) {
const pathname = usePathname();

  console.log("Current location:", pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar className="border-r border-slate-200 bg-white/90 backdrop-blur-sm shadow-xl">
            <SidebarHeader className="border-b border-slate-200 p-6 bg-gradient-to-r from-blue-800 to-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Home className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">Futura Homes</h2>
                  <p className="text-xs text-blue-200 font-medium">Koronadal Property Management</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-4">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`group hover:bg-blue-50 transition-all duration-200 rounded-xl mb-1 ${
                            pathname === item.url 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-500 hover:to-blue-600' 
                              : 'text-slate-700 hover:text-blue-700'
                          }`}
                        >
                          <Link href={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className={`w-5 h-5 ${
                              pathname === item.url ? 'text-amber-300' : 'text-slate-500 group-hover:text-blue-600'
                            }`} />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Quick Stats</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Total Units</span>
                    <span className="font-semibold text-amber-900">150</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Occupancy</span>
                    <span className="font-semibold text-green-600">92%</span>
                  </div>
                </div>
              </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CM</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">Futura Management</p>
                  <p className="text-xs text-slate-500 truncate">Property Administration</p>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col">
            {/* Mobile header */}
            <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 px-6 py-4 md:hidden shadow-sm">
              <div className="flex items-center justify-between">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <div className="flex items-center gap-2">
                  <Home className="w-6 h-6 text-blue-800" />
                  <h1 className="text-lg font-bold text-blue-900">Futura Homes</h1>
                </div>
              </div>
            </header>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}