'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Clock, ChevronRight, Languages, Filter } from 'lucide-react';
import { testsApi, languagesApi } from '@/lib/api';

const CEFR_LEVELS = ['A1','A2','B1','B2','C1','C2'];
const CEFR_COLOR: Record<string, string> = { A1:'bg-emerald-100 text-emerald-800', A2:'bg-teal-100 text-teal-800', B1:'bg-blue-100 text-blue-800', B2:'bg-indigo-100 text-indigo-800', C1:'bg-purple-100 text-purple-800', C2:'bg-pink-100 text-pink-800' };

export default function TestListPage() {
  const [langFilter, setLangFilter] = useState('');
  const [cefrFilter, setCefrFilter] = useState('');

  const { data: tests, isLoading } = useQuery({
    queryKey: ['tests', langFilter, cefrFilter],
    queryFn: () => testsApi.list({ languageId: langFilter || undefined, cefrLevel: cefrFilter || undefined }) as any,
  });
  const { data: languages } = useQuery({ queryKey: ['languages'], queryFn: () => languagesApi.list() as any });

  const testList: any[] = (tests as any)?.data ?? [];
  const langList: any[] = (languages as any)?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tests de langue</h1>
        <p className="text-gray-500 mt-1">Évaluez votre niveau selon le Cadre Européen Commun de Référence</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500"><Filter size={16}/> Filtrer :</div>
        <select value={langFilter} onChange={e=>setLangFilter(e.target.value)} className="input w-auto py-1.5 text-sm">
          <option value="">Toutes les langues</option>
          {langList.map((l:any) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={cefrFilter} onChange={e=>setCefrFilter(e.target.value)} className="input w-auto py-1.5 text-sm">
          <option value="">Tous les niveaux</option>
          {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {(langFilter || cefrFilter) && (
          <button onClick={()=>{setLangFilter('');setCefrFilter('');}} className="text-sm text-red-500 hover:underline">Effacer</button>
        )}
      </div>

      {/* Tests grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i=><div key={i} className="card h-48 animate-pulse bg-gray-50"/>)}
        </div>
      ) : testList.length === 0 ? (
        <div className="card text-center py-16 space-y-3">
          <FlaskConical size={48} className="text-gray-200 mx-auto"/>
          <p className="text-gray-500">Aucun test disponible avec ces filtres</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {testList.map((test: any) => (
            <div key={test.id} className="card-hover group flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Languages size={20} className="text-brand-600"/>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">{test.language?.name}</p>
                    <span className={`badge ${CEFR_COLOR[test.cefrTarget] ?? 'bg-gray-100 text-gray-700'}`}>{test.cefrTarget}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  <Clock size={12}/>{test.durationMinutes} min
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{test.title}</h3>
                {test.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{test.description}</p>}
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>{test._count?.questions ?? 0} questions</span>
                  <span>•</span>
                  <span>Seuil {test.passingScore}%</span>
                </div>
                <Link
                  href={`/test/${test.id}`}
                  className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Commencer <ChevronRight size={16}/>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
