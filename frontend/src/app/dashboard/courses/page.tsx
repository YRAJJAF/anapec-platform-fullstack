'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { BookOpen, ChevronRight, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { CefrBadge } from '@/components/ui/CefrBadge';
import { ProgressRing } from '@/components/ui/CefrBadge';
import clsx from 'clsx';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function CoursesPage() {
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedCefr, setSelectedCefr] = useState('');
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const qc = useQueryClient();

  const { data: languages } = useQuery({ queryKey: ['languages'], queryFn: () => api.getLanguages() as any });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', selectedLang, selectedCefr],
    queryFn: () => api.getCourses({
      ...(selectedLang && { languageId: selectedLang }),
      ...(selectedCefr && { cefrLevel: selectedCefr }),
    }) as any,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => api.getMyEnrollments() as any,
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => api.enroll(courseId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-enrollments'] }); toast.success('Inscrit à la formation !'); },
    onError: (e: any) => toast.error(e.message),
  });

  const enrolledIds = new Set((enrollments ?? []).map((e: any) => e.courseId));
  const enrollmentMap = Object.fromEntries((enrollments ?? []).map((e: any) => [e.courseId, e]));

  const displayCourses = tab === 'mine'
    ? (enrollments ?? []).map((e: any) => ({ ...e.course, enrollment: e }))
    : (courses ?? []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Formations linguistiques</h1>
        <p className="text-slate-500 mt-1">Parcours de remédiation alignés sur les niveaux CECRL</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-lg w-fit">
        {[{ key: 'all', label: 'Toutes les formations' }, { key: 'mine', label: `Mes formations (${enrolledIds.size})` }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={clsx(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters (all tab only) */}
      {tab === 'all' && (
        <div className="card p-4 mb-6 flex flex-wrap gap-3">
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="input w-auto min-w-[150px]">
            <option value="">Toutes les langues</option>
            {(languages ?? []).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <div className="flex gap-1">
            {CEFR_LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setSelectedCefr(selectedCefr === l ? '' : l)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  selectedCefr === l ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-500 hover:border-brand-300',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Courses grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card p-6 h-48 animate-pulse" />)}
        </div>
      ) : displayCourses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">
            {tab === 'mine' ? 'Vous n\'êtes inscrit à aucune formation.' : 'Aucune formation disponible.'}
          </p>
          {tab === 'mine' && (
            <button onClick={() => setTab('all')} className="btn-primary mt-4">Explorer les formations</button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCourses.map((course: any) => {
            const enrolled = enrolledIds.has(course.id);
            const enrollment = enrollmentMap[course.id] ?? course.enrollment;
            return (
              <div key={course.id} className="card p-5 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{course.language?.name}</p>
                      <CefrBadge level={course.cefrLevel} />
                    </div>
                  </div>
                  {enrolled && enrollment && (
                    <ProgressRing progress={enrollment.progressPct ?? 0} size={40} />
                  )}
                </div>

                <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{course.title}</h3>

                {course.description && (
                  <p className="text-sm text-slate-500 flex-1 line-clamp-3 mb-4">{course.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                  <span className="text-xs text-slate-400">{course._count?.lessons ?? 0} leçons</span>
                  {enrolled ? (
                    <Link href={`/dashboard/courses/${course.id}`} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                      Continuer <ChevronRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => enrollMutation.mutate(course.id)}
                      disabled={enrollMutation.isPending}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      {enrollMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "S'inscrire"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
