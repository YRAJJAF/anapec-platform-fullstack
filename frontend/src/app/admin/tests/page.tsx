'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlaskConical, Clock, Plus, BarChart3, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { testsApi, languagesApi } from '@/lib/api';

const CEFR_COLOR: Record<string,string> = { A1:'bg-emerald-100 text-emerald-800', A2:'bg-teal-100 text-teal-800', B1:'bg-blue-100 text-blue-800', B2:'bg-indigo-100 text-indigo-800', C1:'bg-purple-100 text-purple-800', C2:'bg-pink-100 text-pink-800' };

export default function AdminTestsPage() {
  const [langFilter, setLangFilter] = useState('');
  const { data: tests, isLoading } = useQuery({ queryKey:['admin-tests',langFilter], queryFn:()=>testsApi.list({languageId:langFilter||undefined}) as any });
  const { data: languages } = useQuery({ queryKey:['languages'], queryFn:()=>languagesApi.list() as any });
  const testList: any[] = (tests as any)?.data ?? [];
  const langList: any[] = (languages as any)?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Tests</h1><p className="text-gray-500 mt-1">{testList.length} tests disponibles</p></div>
        <button className="btn-primary"><Plus size={16}/> Nouveau test</button>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testList.map((test:any) => (
            <div key={test.id} className="card-hover flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className={`badge ${CEFR_COLOR[test.cefrTarget]??'bg-gray-100 text-gray-700'}`}>{test.cefrTarget}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11}/>{test.durationMinutes} min</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{test.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{test.language?.name}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs text-gray-400">
                <span>{test._count?.questions??0} questions</span>
                <div className="flex gap-3">
                  <span>{test._count?.sessions??0} sessions</span>
                  <span>Seuil {test.passingScore}%</span>
                </div>
              </div>
            </div>
          ))}
          {testList.length === 0 && (
            <div className="col-span-3 card text-center py-16">
              <FlaskConical size={48} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-gray-500">Aucun test créé</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
