'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '@/lib/api';

const CEFR_BADGE: Record<string,string> = { A1:'bg-emerald-100 text-emerald-800', A2:'bg-teal-100 text-teal-800', B1:'bg-blue-100 text-blue-800', B2:'bg-indigo-100 text-indigo-800', C1:'bg-purple-100 text-purple-800', C2:'bg-pink-100 text-pink-800' };

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const { data, isLoading } = useQuery({ queryKey:['admin-users',regionFilter], queryFn:()=>usersApi.list({role:'CANDIDATE',region:regionFilter||undefined}) as any, staleTime:30000 });
  const toggleMut = useMutation({
    mutationFn:({id,isActive}:{id:string;isActive:boolean})=>usersApi.setActive(id,isActive) as any,
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['admin-users']}); toast.success('Statut mis à jour'); },
    onError:()=>toast.error('Erreur'),
  });
  const users: any[] = (data as any)?.data ?? [];
  const filtered = users.filter((u:any)=>{
    if(!search) return true;
    const q = search.toLowerCase();
    return u.firstName?.toLowerCase().includes(q)||u.lastName?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q)||u.cin?.toLowerCase().includes(q);
  });
  const exportCSV = () => {
    const h = ['Prénom','Nom','Email','CIN','Région','Ville','Actif','Tests','Certificats'];
    const r = filtered.map((u:any)=>[u.firstName,u.lastName,u.email,u.cin??'',u.region??'',u.city??'',u.isActive?'Oui':'Non',u._count?.testSessions??0,u._count?.certificates??0]);
    const csv = [h,...r].map(row=>row.map(String).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})); a.download='candidats.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Candidats</h1><p className="text-gray-500 mt-1">{users.length} inscrits</p></div>
        <button onClick={exportCSV} className="btn-secondary"><Download size={16}/> Exporter CSV</button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, email, CIN…" className="input pl-9"/></div>
        <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} className="input w-auto">
          <option value="">Toutes les régions</option>
          {['Casablanca-Settat','Rabat-Salé-Kénitra','Marrakech-Safi','Fès-Meknès','Tanger-Tétouan-Al Hoceïma','Oriental','Souss-Massa'].map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        {(search||regionFilter) && <button onClick={()=>{setSearch('');setRegionFilter('');}} className="text-sm text-red-500 hover:underline px-2">Effacer</button>}
      </div>
      {isLoading ? <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-brand-600"/></div> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-500 font-medium">
                  <th className="text-left px-5 py-3">Candidat</th><th className="text-left px-4 py-3">Région</th><th className="text-left px-4 py-3">Niveau</th><th className="text-center px-4 py-3">Tests</th><th className="text-center px-4 py-3">Certificats</th><th className="text-center px-4 py-3">Statut</th><th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length===0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">Aucun candidat trouvé</td></tr> : filtered.map((u:any)=>{
                  const lastLevel = u.testSessions?.[0]?.cefrResult;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-xs flex-shrink-0">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                          <div><p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p><p className="text-xs text-gray-400">{u.email}</p>{u.cin&&<p className="text-xs text-gray-400 font-mono">CIN: {u.cin}</p>}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600"><p>{u.region??'—'}</p><p className="text-gray-400">{u.city??''}</p></td>
                      <td className="px-4 py-4">{lastLevel?<span className={`badge ${CEFR_BADGE[lastLevel]??'bg-gray-100 text-gray-700'}`}>{lastLevel}</span>:<span className="text-gray-300 text-xs">—</span>}</td>
                      <td className="px-4 py-4 text-center font-semibold text-gray-700">{u._count?.testSessions??0}</td>
                      <td className="px-4 py-4 text-center font-semibold text-amber-600">{u._count?.certificates??0}</td>
                      <td className="px-4 py-4 text-center">{u.isActive?<span className="flex items-center justify-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle size={14}/>Actif</span>:<span className="flex items-center justify-center gap-1 text-xs font-semibold text-red-500"><XCircle size={14}/>Inactif</span>}</td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={()=>toggleMut.mutate({id:u.id,isActive:!u.isActive})} disabled={toggleMut.isPending}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.isActive?'bg-red-50 text-red-600 hover:bg-red-100':'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                          {u.isActive?'Désactiver':'Activer'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">{filtered.length} candidat{filtered.length!==1?'s':''} affiché{filtered.length!==1?'s':''}</div>
        </div>
      )}
    </div>
  );
}
