'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, BookOpen, FlaskConical, Award, User, LogOut, Globe, Menu, X, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/test', label: 'Tests de langue', icon: FlaskConical },
  { href: '/remediation', label: 'Remédiation', icon: BookOpen },
  { href: '/dashboard/certificates', label: 'Mes certificats', icon: Award },
  { href: '/dashboard/profile', label: 'Mon profil', icon: User },
];

function SidebarInner({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const handleLogout = async () => { await logout(); toast.success('Déconnexion réussie'); router.push('/auth/login'); };
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Globe size={18} className="text-white"/>
        </div>
        <div><p className="font-bold text-sm text-gray-900">ANAPEC</p><p className="text-xs text-gray-400">Plateforme Linguistique</p></div>
      </div>
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-brand-50">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={onNav}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'}`}>
              <Icon size={18}/><span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={18}/>Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => { loadUser(); }, []);
  useEffect(() => { if (!isAuthenticated) router.replace('/auth/login'); }, [isAuthenticated]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 flex-shrink-0">
        <SidebarInner/>
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setSidebarOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <span className="font-bold">Menu</span>
              <button onClick={()=>setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20}/></button>
            </div>
            <SidebarInner onNav={()=>setSidebarOpen(false)}/>
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button onClick={()=>setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><Menu size={20}/></button>
          <div className="flex-1"/>
          <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <Bell size={20}/>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"/>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
