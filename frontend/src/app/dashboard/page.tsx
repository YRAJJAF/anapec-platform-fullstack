'use client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Award, FlaskConical, TrendingUp, ArrowRight, Clock, CheckCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { sessionsApi, remediationApi, certificatesApi, reportingApi } from '@/lib/api';

const CEFR_COLOR: Record<string, string> = { A1:'bg-emerald-100 text-emerald-800', A2:'bg-teal-100 text-teal-800', B1:'bg-blue-100 text-blue-800', B2:'bg-indigo-100 text-indigo-800', C1:'bg-purple-100 text-purple-800', C2:'bg-pink-100 text-pink-800' };

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22}/>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: sessions } = useQuery({ queryKey: ['sessions'], queryFn: () => sessionsApi.getMySessions() as any });
  const { data: enrollments } = useQuery({ queryKey: ['enrollments'], queryFn: () => remediationApi.getMyEnrollments() as any });
  const { data: certificates } = useQuery({ queryKey: ['certificates'], queryFn: () => certificatesApi.getMyCertificates() as any });
  const { data: recommendations } = useQuery({ queryKey: ['recommendations'], queryFn: () => remediationApi.getRecommendations() as any });

  const sessionList = (sessions as any)?.data ?? [];
  const enrollmentList = (enrollments as any)?.data ?? [];
  const certList = (certificates as any)?.data ?? [];
  const recList = (recommendations as any)?.data ?? [];

  const completedSessions = sessionList.filter((s: any) => s.status === 'COMPLETED');
  const latestResult = completedSessions[0];
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((a: number, s: any) => a + (s.score ?? 0), 0) / completedSessions.length)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user?.firstName} 👋</h1>
          <p className="text-gray-500 mt-1">Voici votre progression linguistique</p>
        </div>
        <Link href="/test" className="btn-primary hidden sm:inline-flex">
          Passer un test <ArrowRight size={16}/>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FlaskConical} label="Tests passés" value={completedSessions.length} color="bg-blue-50 text-blue-600"/>
        <StatCard icon={TrendingUp} label="Score moyen" value={`${avgScore}%`} color="bg-brand-50 text-brand-600"/>
        <StatCard icon={BookOpen} label="Cours inscrits" value={enrollmentList.length} color="bg-purple-50 text-purple-600"/>
        <StatCard icon={Award} label="Certificats" value={certList.length} color="bg-amber-50 text-amber-600"/>
      </div>

      {/* Latest result + active courses */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Last test result */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Dernier résultat</h2>
            <Link href="/test" className="text-sm text-brand-600 hover:underline flex items-center gap-1">Nouveau test <ArrowRight size={14}/></Link>
          </div>
          {latestResult ? (
            <div className="flex items-center gap-4 p-4 bg-brand-50 rounded-2xl">
              <div className="text-center">
                <div className={`inline-flex px-4 py-2 rounded-xl text-2xl font-bold ${CEFR_COLOR[latestResult.cefrResult] ?? 'bg-gray-100 text-gray-700'}`}>
                  {latestResult.cefrResult ?? '—'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Niveau CECRL</p>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{latestResult.test?.language?.name}</p>
                <p className="text-3xl font-bold text-brand-600 mt-1">{Math.round(latestResult.score ?? 0)}%</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(latestResult.completedAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 space-y-2">
              <FlaskConical size={40} className="text-gray-200"/>
              <p className="text-sm">Aucun test effectué</p>
              <Link href="/test" className="btn-primary text-sm py-2 mt-2">Commencer maintenant</Link>
            </div>
          )}
        </div>

        {/* Active courses */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Cours en cours</h2>
            <Link href="/remediation" className="text-sm text-brand-600 hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14}/></Link>
          </div>
          {enrollmentList.length > 0 ? (
            <div className="space-y-3">
              {enrollmentList.slice(0, 3).map((e: any) => (
                <div key={e.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={18} className="text-purple-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.course?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${e.progressPct}%` }}/>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{Math.round(e.progressPct)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 space-y-2">
              <BookOpen size={40} className="text-gray-200"/>
              <p className="text-sm">Aucun cours inscrit</p>
              <Link href="/remediation" className="btn-secondary text-sm py-2 mt-2">Explorer les cours</Link>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Star size={18} className="text-amber-500"/> Recommandés pour vous</h2>
            <Link href="/remediation" className="text-sm text-brand-600 hover:underline">Voir tout</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recList.slice(0, 3).map((c: any) => (
              <Link key={c.id} href={`/remediation/${c.id}`} className="card-hover group">
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${CEFR_COLOR[c.cefrLevel] ?? 'bg-gray-100 text-gray-700'}`}>{c.cefrLevel}</span>
                  <span className="text-xs text-gray-400">{c.language?.name}</span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{c.title}</h3>
                {c.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-400">{c._count?.lessons ?? 0} leçons</span>
                  <ArrowRight size={16} className="text-brand-400 group-hover:translate-x-1 transition-transform"/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {certList.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Mes certificats</h2>
            <Link href="/dashboard/certificates" className="text-sm text-brand-600 hover:underline flex items-center gap-1">Voir tout <ArrowRight size={14}/></Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {certList.slice(0, 4).map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <Award size={20} className="text-amber-600 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{c.language} — Niveau {c.cefrLevel}</p>
                  <p className="text-xs text-gray-500">{new Date(c.issuedAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0"/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
