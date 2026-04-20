'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FlaskConical, Clock, ChevronRight, Filter } from 'lucide-react';
import api from '@/lib/api';
import { CefrBadge } from '@/components/ui/CefrBadge';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function TestsPage() {
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedCefr, setSelectedCefr] = useState('');

  const { data: languages } = useQuery({
    queryKey: ['languages'],
    queryFn: () => api.getLanguages() as any,
  });

  const { data: tests, isLoading } = useQuery({
    queryKey: ['tests', selectedLang, selectedCefr],
    queryFn: () => api.getTests({
      ...(selectedLang && { languageId: selectedLang }),
      ...(selectedCefr && { cefrLevel: selectedCefr }),
    }) as any,
  });

  const { data: mySessions } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: () => api.getMySessions() as any,
  });

  const completedTestIds = new Set(
    (mySessions ?? [])
      .filter((s: any) => s.status === 'COMPLETED')
      .map((s: any) => s.testId)
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tests de langue</h1>
        <p className="text-slate-500 mt-1">Évaluez votre niveau selon le Cadre Européen Commun de Référence (CECRL)</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="input w-auto min-w-[160px]"
        >
          <option value="">Toutes les langues</option>
          {(languages ?? []).map((l: any) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select
          value={selectedCefr}
          onChange={(e) => setSelectedCefr(e.target.value)}
          className="input w-auto"
        >
          <option value="">Tous les niveaux</option>
          {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        {(selectedLang || selectedCefr) && (
          <button onClick={() => { setSelectedLang(''); setSelectedCefr(''); }} className="btn-ghost text-xs">
            Effacer filtres
          </button>
        )}
      </div>

      {/* Tests grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(tests ?? []).map((test: any) => {
            const done = completedTestIds.has(test.id);
            return (
              <div key={test.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{test.title}</h3>
                      <p className="text-xs text-slate-400">{test.language?.name}</p>
                    </div>
                  </div>
                  <CefrBadge level={test.cefrTarget} />
                </div>

                {test.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{test.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {test.durationMinutes} min
                    </span>
                    <span>{test._count?.questions ?? 0} questions</span>
                  </div>

                  {done ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 font-medium">✓ Complété</span>
                      <Link href={`/dashboard/tests/${test.id}/start`} className="btn-secondary text-xs py-1.5 px-3">
                        Repasser
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/dashboard/tests/${test.id}/start`} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                      Commencer <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {(tests ?? []).length === 0 && (
            <div className="col-span-2 text-center py-16">
              <FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">Aucun test disponible pour ces critères.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
