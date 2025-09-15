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
  MapPin,
  Power,
  FileBarChart
} from "lucide-react";
// import NotificationBell from "@/components/ui/NotificationBell";
// import MockNotificationBell from "@/components/ui/MockNotificationBell";
import RealNotificationBell from "@/components/ui/RealNotificationBell";
import { useNewItemCounts } from "@/hooks/useNewItemCounts";
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
import { useState } from "react";


const navigationItems = [
  {
    title: "Dashboard",
    url: '/dashboard',
    icon: LayoutDashboard,
    countKey: null,
  },
  {
    title: "Properties",
    url: '/properties',
    icon: Home,
    countKey: 'properties',
  },
  {
    title: "Homeowners", 
    url: '/homeowners',
    icon: Users,
    countKey: 'homeowners',
  },
  {
    title: "Billing",
    url: '/billing',
    icon: FileText,
    countKey: null,
  },
  {
    title: "Service Requests",
    url: '/service-requests',
    icon: Wrench,
    countKey: 'serviceRequests',
  },
  {
    title: "Inquiries",
    url: '/inquiries',
    icon: MessageSquare,
    countKey: 'inquiries',
  },
  {
    title: "Complaints",
    url: '/complaints',
    icon: AlertTriangle,
    countKey: 'complaints',
  },
  {
    title: "Announcements",
    url: '/announcements',
    icon: Megaphone,
    countKey: 'announcements',
  },
  {
    title: "Reservations",
    url: '/reservations',
    icon: Calendar,
    countKey: 'reservations',
  },
  {
    title: "Transactions",
    url: '/transactions',
    icon: DollarSign,
    countKey: 'transactions',
  },
  {
    title: "Property Map",
    url: '/property-map',
    icon: MapPin,
    countKey: null,
  },
  {
    title: "Reports",
    url: '/reports',
    icon: FileBarChart,
    countKey: null,
  }
];

export default function MainLayout({ children, currentPageName }) {
const pathname = usePathname();
const { counts, loading } = useNewItemCounts();

 const [showLogout, setShowLogout] = useState(false);

  const handleContainerClick = () => {
    setShowLogout(!showLogout);
  };

   const handleLogout = () => {
    // Add your logout logic here
    alert('Logging out...');
    setShowLogout(false);
    
    // Check if we're on the client side before accessing localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.location.href = '/login'; // Redirect to login page
    }
  };


  console.log("Current location:", pathname);
  console.log("New item counts:", counts);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar className="border-r border-slate-200 bg-white/90 backdrop-blur-sm shadow-xl">
            <SidebarHeader className="border-b border-slate-200 p-6 bg-gradient-to-r from-red-400 to-red-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
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
                              ? 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-md hover:from-red-400 to-red-500 hover:to-blue-600' 
                              : 'text-slate-700 hover:text-blue-700'
                          }`}
                        >
                          <Link href={item.url} className="flex items-center justify-between px-4 py-3 w-full">
                            <div className="flex items-center gap-3">
                              <item.icon className={`w-5 h-5 ${
                                pathname === item.url ? 'text-amber-300' : 'text-slate-500 group-hover:text-blue-600'
                              }`} />
                              <span className="font-medium">{item.title}</span>
                            </div>
                            {/* New Items Badge */}
                            {item.countKey && counts[item.countKey] > 0 && (
                              <span className={`w-4 h-4 p-2 flex justify-center items-center rounded-full text-xs font-bold ${
                                pathname === item.url 
                                  ? 'bg-amber-400 text-amber-900' 
                                  : 'bg-red-500 text-white group-hover:bg-red-600'
                              } animate-pulse`}>
                                {counts[item.countKey] > 99 ? '99+' : counts[item.countKey]}
                              </span>
                            )}
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

            <SidebarFooter className="border-t border-slate-200 p-4 bg-slate-50 relative">
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-slate-100 rounded-lg p-2 transition-colors"
          onClick={handleContainerClick}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">FM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">Futura Management</p>
              <p className="text-xs text-slate-500 truncate">Property Administration</p>
            </div>
          </div>
        </div>

        {/* Logout Button - appears when container is clicked */}
        {showLogout && (
          <div className="absolute bottom-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mb-1 overflow-hidden z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
            >
              <Power size={18} />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        )}
      </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col">
            {/* Main Header - Visible on all screen sizes */}
            <header className="relative bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 shadow-sm z-10">
              <div className="flex items-center justify-between">
                {/* Left side - Mobile menu trigger and title */}
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:hidden hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                  <div className="flex items-center gap-2 md:hidden">
                    <Home className="w-5 h-5 text-red-600" />
                    <h1 className="text-base font-bold text-slate-900">Futura Homes</h1>
                  </div>
                  {/* Desktop page title */}
                  <div className="hidden md:block">
                    <h1 className="text-xl font-semibold text-slate-900">
                      {currentPageName || 'Dashboard'}
                    </h1>
                    <p className="text-sm text-slate-600">Futura Homes Koronadal Property Management</p>
                  </div>
                </div>

                {/* Right side - Notification Bell and User Info */}
                <div className="flex items-center gap-3">
                  {/* Notification Bell */}
                  <RealNotificationBell />

                  {/* User Avatar - Desktop only */}
                  <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">Futura Management</p>
                      <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">FM</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Main content */}
            <div className="flex-1 overflow-auto bg-gradient-to-br from-blue-50/30 to-indigo-100/30">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}