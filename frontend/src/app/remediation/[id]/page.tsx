'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BookOpen, Play, CheckCircle, Lock, ChevronRight,
  ArrowLeft, Volume2, Loader2, Award, Clock
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { remediationApi } from '@/lib/api';

const LESSON_ICON: Record<string, React.ReactNode> = {
  VIDEO:     <Play size={16} />,
  AUDIO:     <Volume2 size={16} />,
  READING:   <BookOpen size={16} />,
  EXERCISE:  <span className="text-xs font-bold">Ex</span>,
  QUIZ:      <span className="text-xs font-bold">QCM</span>,
  VOCABULARY:<span className="text-xs font-bold">Voc</span>,
  GRAMMAR:   <span className="text-xs font-bold">Gr</span>,
};

const CEFR_COLOR: Record<string, string> = {
  A1:'bg-emerald-100 text-emerald-800', A2:'bg-teal-100 text-teal-800',
  B1:'bg-blue-100 text-blue-800',       B2:'bg-indigo-100 text-indigo-800',
  C1:'bg-purple-100 text-purple-800',   C2:'bg-pink-100 text-pink-800',
};

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [activeLesson, setActiveLesson] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => remediationApi.getCourse(id) as any,
  });

  const enrollMutation = useMutation({
    mutationFn: () => remediationApi.enroll(id) as any,
    onSuccess: () => {
      toast.success('Inscription réussie !');
      qc.invalidateQueries({ queryKey: ['course', id] });
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
    onError: () => toast.error('Erreur lors de l\'inscription'),
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId: string) => remediationApi.completeLesson(id, lessonId) as any,
    onSuccess: () => {
      toast.success('Leçon complétée !');
      qc.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  const course = (data as any)?.data;
  const enrollment = course?.enrollment;
  const lessons: any[] = course?.lessons ?? [];
  const progress = enrollment?.progressPct ?? 0;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-brand-600" />
    </div>
  );
  if (!course) return (
    <div className="text-center py-16 text-gray-400">Cours introuvable</div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/remediation" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors">
        <ArrowLeft size={16} /> Retour aux cours
      </Link>

      {/* Hero */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`badge ${CEFR_COLOR[course.cefrLevel] ?? 'bg-gray-100 text-gray-700'}`}>
                {course.cefrLevel}
              </span>
              <span className="text-sm text-gray-500 font-medium">{course.language?.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            {course.description && (
              <p className="text-gray-500 max-w-xl leading-relaxed">{course.description}</p>
            )}
          </div>
          {!enrollment ? (
            <button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="btn-primary"
            >
              {enrollMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              S'inscrire gratuitement
            </button>
          ) : (
            <div className="text-right">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle size={18} /> Inscrit
              </div>
              {enrollment.status === 'COMPLETED' && (
                <div className="flex items-center gap-1 mt-1 text-amber-600 text-xs">
                  <Award size={14} /> Cours complété !
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {enrollment && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Progression</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 pt-2 border-t border-gray-100 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <BookOpen size={14} /> {lessons.length} leçons
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {lessons.reduce((a: number, l: any) => a + (l.durationMinutes ?? 0), 0)} min estimées
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lesson list */}
        <div className="lg:col-span-1 card space-y-2 p-4">
          <h2 className="font-semibold text-gray-900 px-2 mb-3">Leçons du cours</h2>
          {lessons.length === 0 && (
            <p className="text-sm text-gray-400 px-2">Aucune leçon disponible</p>
          )}
          {lessons.map((lesson: any, i: number) => {
            const unlocked = !!enrollment;
            const isActive = activeLesson?.id === lesson.id;
            return (
              <button
                key={lesson.id}
                disabled={!unlocked}
                onClick={() => setActiveLesson(isActive ? null : lesson)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all
                  ${isActive ? 'bg-brand-50 border-2 border-brand-200' : 'hover:bg-gray-50 border-2 border-transparent'}
                  ${!unlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm
                  ${isActive ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {LESSON_ICON[lesson.type] ?? <BookOpen size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-brand-700' : 'text-gray-700'}`}>
                    {i + 1}. {lesson.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{lesson.durationMinutes} min</p>
                </div>
                {!unlocked
                  ? <Lock size={14} className="text-gray-300 flex-shrink-0" />
                  : isActive
                  ? <ChevronRight size={14} className="text-brand-500 flex-shrink-0" />
                  : null
                }
              </button>
            );
          })}
        </div>

        {/* Lesson viewer */}
        <div className="lg:col-span-2">
          {activeLesson ? (
            <LessonViewer
              lesson={activeLesson}
              onComplete={() => {
                completeMutation.mutate(activeLesson.id);
                const idx = lessons.findIndex((l: any) => l.id === activeLesson.id);
                if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1]);
                else setActiveLesson(null);
              }}
              completing={completeMutation.isPending}
            />
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center space-y-3">
              <BookOpen size={48} className="text-gray-200" />
              <p className="text-gray-500 font-medium">
                {enrollment
                  ? 'Sélectionnez une leçon pour commencer'
                  : 'Inscrivez-vous pour accéder aux leçons'}
              </p>
              {!enrollment && (
                <button onClick={() => enrollMutation.mutate()} className="btn-primary mt-2">
                  S'inscrire maintenant
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LessonViewer({ lesson, onComplete, completing }: {
  lesson: any; onComplete: () => void; completing: boolean;
}) {
  const content = lesson.content ?? {};

  return (
    <div className="card space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="badge bg-gray-100 text-gray-600 mb-2">{lesson.type}</span>
          <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
          <Clock size={12} /> {lesson.durationMinutes} min
        </span>
      </div>

      {/* Audio player */}
      {lesson.audioUrl && (
        <div className="bg-brand-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-brand-700 mb-2 flex items-center gap-1">
            <Volume2 size={14} /> Écouter
          </p>
          <audio controls src={lesson.audioUrl} className="w-full" />
        </div>
      )}

      {/* Video */}
      {lesson.videoUrl && (
        <div className="rounded-2xl overflow-hidden bg-black aspect-video">
          <video controls src={lesson.videoUrl} className="w-full h-full" />
        </div>
      )}

      {/* Text content */}
      {content.text && (
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed bg-gray-50 rounded-2xl p-5">
          <p>{content.text}</p>
        </div>
      )}

      {/* Vocabulary list */}
      {content.vocabulary && Array.isArray(content.vocabulary) && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm">Vocabulaire</h3>
          <div className="grid grid-cols-2 gap-2">
            {content.vocabulary.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                <span className="font-medium text-gray-900">{item.word}</span>
                <span className="text-gray-500 text-xs">{item.translation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercises */}
      {content.exercises && Array.isArray(content.exercises) && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Exercices</h3>
          {content.exercises.map((ex: any, i: number) => (
            <div key={i} className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="font-medium text-gray-900 text-sm">{i + 1}. {ex.question}</p>
              {ex.options && (
                <div className="mt-2 space-y-1">
                  {ex.options.map((opt: string, j: number) => (
                    <label key={j} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="radio" name={`ex-${i}`} value={opt} className="accent-brand-600" />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button
          onClick={onComplete}
          disabled={completing}
          className="btn-primary"
        >
          {completing && <Loader2 size={16} className="animate-spin" />}
          {completing ? 'En cours...' : 'Marquer comme complété'}
          {!completing && <CheckCircle size={16} />}
        </button>
      </div>
    </div>
  );
}
