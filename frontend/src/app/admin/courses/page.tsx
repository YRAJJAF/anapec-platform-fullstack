'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BookOpen, Users, Plus, Loader2 } from 'lucide-react';
import { remediationApi, languagesApi } from '@/lib/api';

const CEFR_COLOR: Record<string,string> = { A1:'bg-emerald-100 text-emerald-800', A2:'bg-teal-100 text-teal-800', B1:'bg-blue-100 text-blue-800', B2:'bg-indigo-100 text-indigo-800', C1:'bg-purple-100 text-purple-800', C2:'bg-pink-100 text-pink-800' };

export default function AdminCoursesPage() {
  const [langFilter, setLangFilter] = useState('');
  const { data: courses, isLoading } = useQuery({ queryKey:['admin-courses',langFilter], queryFn:()=>remediationApi.getCourses({languageId:langFilter||undefined}) as any });
  const { data: languages } = useQuery({ queryKey:['languages'], queryFn:()=>languagesApi.list() as any });
  const courseList: any[] = (courses as any)?.data ?? [];
  const langList: any[] = (languages as any)?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Cours de remédiation</h1><p className="text-gray-500 mt-1">{courseList.length} cours disponibles</p></div>
        <button className="btn-primary"><Plus size={16}/> Nouveau cours</button>
      </div>
      <div className="flex gap-3">
        <select value={langFilter} onChange={e=>setLangFilter(e.target.value)} className="input w-auto">
          <option value="">Toutes les langues</option>
          {langList.map((l:any)=><option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {langFilter && <button onClick={()=>setLangFilter('')} className="text-sm text-red-500 hover:underline">Effacer</button>}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-brand-600"/></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 font-medium">
                <th className="text-left px-5 py-3">Cours</th>
                <th className="text-left px-4 py-3">Langue</th>
                <th className="text-left px-4 py-3">Niveau</th>
                <th className="text-center px-4 py-3">Leçons</th>
                <th className="text-center px-4 py-3">Inscrits</th>
                <th className="text-center px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courseList.length === 0
                ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">Aucun cours</td></tr>
                : courseList.map((c:any) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0"><BookOpen size={14} className="text-purple-600"/></div>
                        <div><p className="font-medium text-gray-900">{c.title}</p>{c.description && <p className="text-xs text-gray-400 truncate max-w-xs">{c.description}</p>}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{c.language?.name}</td>
                    <td className="px-4 py-4"><span className={`badge ${CEFR_COLOR[c.cefrLevel]??'bg-gray-100 text-gray-700'}`}>{c.cefrLevel}</span></td>
                    <td className="px-4 py-4 text-center font-semibold text-gray-700">{c._count?.lessons??0}</td>
                    <td className="px-4 py-4 text-center"><span className="flex items-center justify-center gap-1 text-gray-600"><Users size={12}/>{c._count?.enrollments??0}</span></td>
                    <td className="px-4 py-4 text-center"><span className={`badge ${c.isActive?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>{c.isActive?'Actif':'Inactif'}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
