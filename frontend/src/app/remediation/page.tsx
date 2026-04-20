'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Users, Star, Filter, ArrowRight, Loader2 } from 'lucide-react';
import { remediationApi, languagesApi } from '@/lib/api';

const CEFR_LEVELS = ['A1','A2','B1','B2','C1','C2'];
const CEFR_COLOR: Record<string, string> = {
  A1:'bg-emerald-100 text-emerald-800', A2:'bg-teal-100 text-teal-800',
  B1:'bg-blue-100 text-blue-800',       B2:'bg-indigo-100 text-indigo-800',
  C1:'bg-purple-100 text-purple-800',   C2:'bg-pink-100 text-pink-800',
};

export default function RemediationPage() {
  const [langFilter, setLangFilter] = useState('');
  const [cefrFilter, setCefrFilter] = useState('');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', langFilter, cefrFilter],
    queryFn: () => remediationApi.getCourses({
      languageId: langFilter || undefined,
      cefrLevel: cefrFilter || undefined,
    }) as any,
  });
  const { data: languages } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesApi.list() as any,
  });
  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => remediationApi.getMyEnrollments() as any,
  });

  const courseList: any[] = (courses as any)?.data ?? [];
  const langList: any[]   = (languages as any)?.data ?? [];
  const enrolledIds = new Set(((enrollments as any)?.data ?? []).map((e: any) => e.courseId));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Remédiation linguistique</h1>
        <p className="text-gray-500 mt-1">
          Parcours personnalisés couvrant les 4 compétences : compréhension, expression, oral et écrit
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Filter size={16} /> Filtrer :
        </div>
        <select
          value={langFilter}
          onChange={e => setLangFilter(e.target.value)}
          className="input w-auto py-1.5 text-sm"
        >
          <option value="">Toutes les langues</option>
          {langList.map((l: any) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <div className="flex gap-2 flex-wrap">
          {CEFR_LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setCefrFilter(cefrFilter === l ? '' : l)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${cefrFilter === l ? CEFR_COLOR[l] + ' border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              {l}
            </button>
          ))}
        </div>
        {(langFilter || cefrFilter) && (
          <button
            onClick={() => { setLangFilter(''); setCefrFilter(''); }}
            className="text-sm text-red-500 hover:underline ml-auto"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-56 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : courseList.length === 0 ? (
        <div className="card text-center py-16 space-y-3">
          <BookOpen size={48} className="text-gray-200 mx-auto" />
          <p className="text-gray-500 font-medium">Aucun cours disponible avec ces filtres</p>
          <button
            onClick={() => { setLangFilter(''); setCefrFilter(''); }}
            className="btn-secondary text-sm"
          >
            Voir tous les cours
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courseList.map((course: any) => {
            const isEnrolled = enrolledIds.has(course.id);
            return (
              <Link
                key={course.id}
                href={`/remediation/${course.id}`}
                className="card-hover group flex flex-col gap-4"
              >
                {/* Top */}
                <div className="flex items-center justify-between">
                  <span className={`badge ${CEFR_COLOR[course.cefrLevel] ?? 'bg-gray-100 text-gray-700'}`}>
                    {course.cefrLevel}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{course.language?.name}</span>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors leading-snug">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} /> {course._count?.lessons ?? 0} leçons
                    </span>
                    {course._count?.enrollments > 0 && (
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {course._count.enrollments}
                      </span>
                    )}
                  </div>
                  {isEnrolled ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Inscrit
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-brand-600 font-medium group-hover:underline">
                      S'inscrire <ArrowRight size={12} />
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
