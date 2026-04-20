'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, FlaskConical, BookOpen, BarChart3, Globe, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const NAV = [
  { href:'/admin', label:"Vue d'ensemble", icon:LayoutDashboard },
  { href:'/admin/users', label:'Candidats', icon:Users },
  { href:'/admin/tests', label:'Tests', icon:FlaskConical },
  { href:'/admin/courses', label:'Cours', icon:BookOpen },
  { href:'/admin/analytics', label:'Analytiques', icon:BarChart3 },
];

function Sidebar({ onNav }: { onNav?:()=>void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0"><Globe size={18} className="text-white"/></div>
        <div><p className="font-bold text-sm text-gray-900">ANAPEC Admin</p><p className="text-xs text-gray-400">Espace administration</p></div>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-amber-50">
          <ShieldCheck size={16} className="text-amber-600 flex-shrink-0"/>
          <div className="min-w-0"><p className="font-semibold text-xs text-gray-900 truncate">{user?.firstName} {user?.lastName}</p><p className="text-xs text-amber-600 font-medium">{user?.role}</p></div>
        </div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={onNav} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon size={18}/>{label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100 space-y-1">
        <Link href="/dashboard" onClick={onNav} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <Globe size={16}/> Espace candidat
        </Link>
        <button onClick={async()=>{await logout();toast.success('Déconnexion');router.push('/auth/login');}} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut size={16}/> Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, loadUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  useEffect(() => { loadUser(); }, []);
  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (user && !['ADMIN','SUPER_ADMIN','EVALUATOR'].includes(user.role)) router.replace('/dashboard');
  }, [isAuthenticated, user]);
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 flex-shrink-0"><Sidebar/></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b"><span className="font-bold">Administration</span><button onClick={()=>setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20}/></button></div>
            <Sidebar onNav={()=>setOpen(false)}/>
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button onClick={()=>setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><Menu size={20}/></button>
          <div className="flex-1"/>
          <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1"><ShieldCheck size={12}/> Administration</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
