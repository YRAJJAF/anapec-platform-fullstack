'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Award, ArrowRight, BarChart3, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { sessionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const CEFR_DESCS: Record<string, string> = {
  A1: 'Niveau débutant — Vous comprenez et utilisez des expressions familières du quotidien.',
  A2: 'Élémentaire — Vous communiquez sur des sujets familiers simples.',
  B1: 'Intermédiaire — Vous comprenez les points essentiels d\'une conversation courante.',
  B2: 'Intermédiaire avancé — Vous comprenez le contenu principal de sujets abstraits.',
  C1: 'Avancé — Vous maîtrisez une large gamme de textes longs et complexes.',
  C2: 'Maîtrise — Vous comprenez et utilisez la langue avec aisance dans toutes les situations.',
};
const CEFR_COLOR: Record<string, string> = { A1:'text-emerald-600 bg-emerald-50', A2:'text-teal-600 bg-teal-50', B1:'text-blue-600 bg-blue-50', B2:'text-indigo-600 bg-indigo-50', C1:'text-purple-600 bg-purple-50', C2:'text-pink-600 bg-pink-50' };

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['session-result', id],
    queryFn: () => sessionsApi.getById(id) as any,
  });

  const session = (data as any)?.data;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-600"/></div>
  );
  if (!session) return <div className="text-center py-16 text-gray-400">Résultat introuvable</div>;

  const passed = (session.score ?? 0) >= (session.test?.passingScore ?? 60);
  const cefrLevel = session.cefrResult;
  const colorClass = cefrLevel ? CEFR_COLOR[cefrLevel] : 'text-gray-600 bg-gray-50';

  // Breakdown by type
  const breakdown: Record<string, { earned: number; total: number }> = {};
  for (const ans of (session.answers ?? [])) {
    const t = ans.question?.type ?? 'UNKNOWN';
    if (!breakdown[t]) breakdown[t] = { earned: 0, total: 0 };
    breakdown[t].total += ans.question?.points ?? 1;
    breakdown[t].earned += ans.pointsEarned ?? (ans.isCorrect ? (ans.question?.points ?? 1) : 0);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main result card */}
      <div className={`card text-center space-y-4 border-2 ${passed ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-100 bg-red-50/20'}`}>
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
          {passed ? <CheckCircle size={40} className="text-emerald-600"/> : <XCircle size={40} className="text-red-500"/>}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{passed ? 'Félicitations !' : 'Continuez vos efforts'}</h1>
          <p className="text-gray-500 mt-1">{session.test?.title}</p>
        </div>
        <div className="flex items-center justify-center gap-8">
          <div>
            <p className="text-5xl font-bold text-gray-900">{Math.round(session.score ?? 0)}<span className="text-2xl text-gray-400">%</span></p>
            <p className="text-sm text-gray-500 mt-1">Score obtenu</p>
          </div>
          {cefrLevel && (
            <div>
              <div className={`text-4xl font-bold px-6 py-3 rounded-2xl ${colorClass}`}>{cefrLevel}</div>
              <p className="text-sm text-gray-500 mt-1">Niveau CECRL</p>
            </div>
          )}
        </div>
        {cefrLevel && <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">{CEFR_DESCS[cefrLevel]}</p>}
        {passed && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl inline-flex mx-auto">
            <Award size={16} className="text-amber-600"/>
            <span className="text-sm text-amber-800 font-medium">Certificat émis automatiquement</span>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><BarChart3 size={18}/> Détail par compétence</h2>
          <div className="space-y-3">
            {Object.entries(breakdown).map(([type, { earned, total }]) => {
              const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize">{type.replace(/_/g,' ').toLowerCase()}</span>
                    <span className="font-medium text-gray-900">{earned}/{total} pts ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 60 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next steps */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Prochaines étapes</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/remediation" className="flex items-center gap-3 p-4 bg-brand-50 border border-brand-100 rounded-xl hover:bg-brand-100 transition-colors">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 text-sm font-bold">📚</div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Remédiation</p>
              <p className="text-xs text-gray-500">Améliorez votre niveau</p>
            </div>
            <ArrowRight size={16} className="text-brand-400 ml-auto"/>
          </Link>
          <Link href="/dashboard/certificates" className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">🏅</div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Mes certificats</p>
              <p className="text-xs text-gray-500">Télécharger votre attestation</p>
            </div>
            <ArrowRight size={16} className="text-amber-400 ml-auto"/>
          </Link>
        </div>
        <div className="flex gap-3 pt-2">
          <Link href="/test" className="btn-secondary flex-1 justify-center">Repasser un test</Link>
          <Link href="/dashboard" className="btn-primary flex-1 justify-center">Mon tableau de bord</Link>
        </div>
      </div>
    </div>
  );
}
