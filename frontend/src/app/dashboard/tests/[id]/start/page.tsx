'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Clock, ChevronRight, ChevronLeft, Mic, MicOff,
  CheckCircle, AlertCircle, Send, Loader2, Volume2,
} from 'lucide-react';
import api from '@/lib/api';
import { CefrBadge } from '@/components/ui/CefrBadge';
import clsx from 'clsx';

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK' | 'READING_COMPREHENSION' | 'LISTENING_COMPREHENSION' | 'WRITING' | 'SPEAKING';

interface Question {
  id: string;
  type: QuestionType;
  content: string;
  contentAr?: string;
  options?: { key: string; text: string }[];
  audioUrl?: string;
  points: number;
  orderIndex: number;
}

// ── Timer hook ────────────────────────────────────────────────────────────────
function useTimer(totalSeconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const ref = useRef<NodeJS.Timeout>();

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(ref.current); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const pct = (remaining / totalSeconds) * 100;
  const urgent = remaining < 120;

  return { display: `${mm}:${ss}`, pct, urgent };
}

// ── Audio Recorder ────────────────────────────────────────────────────────────
function AudioRecorder({ onRecorded }: { onRecorded: (blob: Blob) => void }) {
  const [recording, setRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      onRecorded(blob);
      setHasRecording(true);
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorder.current.start();
    setRecording(true);
  };

  const stop = () => { mediaRecorder.current?.stop(); setRecording(false); };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <button
        onClick={recording ? stop : start}
        className={clsx(
          'w-20 h-20 rounded-full flex items-center justify-center transition-all',
          recording
            ? 'bg-red-500 text-white animate-pulse-soft shadow-lg shadow-red-200'
            : 'bg-brand-600 text-white hover:bg-brand-700',
        )}
      >
        {recording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
      </button>
      <p className="text-sm text-slate-500">
        {recording ? 'Enregistrement en cours… Cliquez pour arrêter' : hasRecording ? '✓ Réponse enregistrée' : 'Cliquez pour commencer l\'enregistrement'}
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TestStartPage() {
  const { id: testId } = useParams<{ id: string }>();
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [audioAnswers, setAudioAnswers] = useState<Record<string, Blob>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ['test-candidate', testId],
    queryFn: () => api.getTestForCandidate(testId) as any,
  });

  const startMutation = useMutation({
    mutationFn: () => api.startSession(testId) as any,
    onSuccess: (data: any) => setSessionId(data.session.id),
    onError: (e: any) => toast.error(e.message),
  });

  const submitAnswerMutation = useMutation({
    mutationFn: (data: { questionId: string; userAnswer?: string }) =>
      api.submitAnswer(sessionId!, data) as any,
  });

  const completeMutation = useMutation({
    mutationFn: () => api.completeSession(sessionId!) as any,
    onSuccess: (data: any) => { setResult(data); setSubmitted(true); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleExpire = useCallback(() => {
    if (sessionId && !submitted) completeMutation.mutate();
  }, [sessionId, submitted]);

  const questions: Question[] = test?.questions ?? [];
  const current = questions[currentIdx];
  const durationSecs = (test?.durationMinutes ?? 60) * 60;
  const timer = useTimer(durationSecs, handleExpire);

  useEffect(() => {
    if (test && !sessionId) startMutation.mutate();
  }, [test]);

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const saveAndNext = async () => {
    if (!sessionId || !current) return;
    const answer = answers[current.id];
    const audioBlob = audioAnswers[current.id];

    if (current.type === 'SPEAKING' && audioBlob) {
      await api.uploadAudio(sessionId, current.id, audioBlob);
    } else if (answer !== undefined) {
      await submitAnswerMutation.mutateAsync({ questionId: current.id, userAnswer: answer });
    }

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    // Save last answer
    const answer = answers[current?.id];
    const audioBlob = audioAnswers[current?.id];
    if (current?.type === 'SPEAKING' && audioBlob) {
      await api.uploadAudio(sessionId, current.id, audioBlob);
    } else if (answer) {
      await submitAnswerMutation.mutateAsync({ questionId: current.id, userAnswer: answer });
    }
    completeMutation.mutate();
  };

  if (testLoading || startMutation.isPending) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Préparation du test…</p>
        </div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (submitted && result) {
    const r = result.result;
    const passed = r?.passed;
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-lg w-full text-center animate-slide-up">
          <div className={clsx(
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6',
            passed ? 'bg-emerald-100' : 'bg-orange-100',
          )}>
            {passed
              ? <CheckCircle className="w-10 h-10 text-emerald-600" />
              : <AlertCircle className="w-10 h-10 text-orange-500" />}
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {passed ? 'Félicitations !' : 'Test terminé'}
          </h2>
          <p className="text-slate-500 mb-6">
            {passed
              ? 'Vous avez réussi ce test et un certificat a été généré.'
              : 'Continuez vos formations pour améliorer votre niveau.'}
          </p>

          <div className="card p-6 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-bold text-brand-600">{r?.score?.toFixed(0)}%</p>
                <p className="text-xs text-slate-400 mt-1">Score obtenu</p>
              </div>
              <div>
                <div className="flex justify-center">
                  <CefrBadge level={r?.cefrLevel} large />
                </div>
                <p className="text-xs text-slate-400 mt-1">Niveau CECRL</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-700">{r?.earnedPoints}/{r?.totalPoints}</p>
                <p className="text-xs text-slate-400 mt-1">Points</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push('/dashboard')} className="btn-secondary">
              Tableau de bord
            </button>
            <button onClick={() => router.push('/dashboard/courses')} className="btn-primary">
              Voir les formations recommandées
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">{test?.title}</span>
          <CefrBadge level={test?.cefrTarget} />
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-slate-400">
            {currentIdx + 1} / {questions.length}
          </span>
          <div className={clsx(
            'flex items-center gap-2 text-sm font-mono font-medium',
            timer.urgent ? 'text-red-600 animate-pulse' : 'text-slate-700',
          )}>
            <Clock className="w-4 h-4" />
            {timer.display}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar rounded-none h-1 flex-shrink-0">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <span className="badge bg-brand-50 text-brand-700 mb-3">
              {current.type.replace(/_/g, ' ')} · {current.points} pt{current.points > 1 ? 's' : ''}
            </span>
            <h2 className="text-lg font-medium text-slate-800 leading-relaxed">{current.content}</h2>
            {current.contentAr && (
              <p className="text-slate-500 mt-2 text-base" dir="rtl" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>
                {current.contentAr}
              </p>
            )}
          </div>

          {/* Audio player for listening questions */}
          {current.audioUrl && (
            <div className="card p-4 mb-6 flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <audio controls className="flex-1" src={current.audioUrl}>
                Votre navigateur ne supporte pas l'audio.
              </audio>
            </div>
          )}

          {/* Answer input based on type */}
          {(current.type === 'MULTIPLE_CHOICE' || current.type === 'TRUE_FALSE' || current.type === 'READING_COMPREHENSION' || current.type === 'LISTENING_COMPREHENSION') && current.options && (
            <div className="space-y-3">
              {(current.options as any[]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setAnswer(current.id, opt.key)}
                  className={clsx(
                    'question-option w-full text-left',
                    answers[current.id] === opt.key && 'selected',
                  )}
                >
                  <span className={clsx(
                    'w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-medium flex-shrink-0',
                    answers[current.id] === opt.key
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-slate-200 text-slate-500',
                  )}>
                    {opt.key}
                  </span>
                  <span className="text-sm text-slate-700">{opt.text}</span>
                </button>
              ))}
            </div>
          )}

          {current.type === 'FILL_IN_BLANK' && (
            <input
              type="text"
              value={answers[current.id] ?? ''}
              onChange={(e) => setAnswer(current.id, e.target.value)}
              className="input text-base"
              placeholder="Votre réponse…"
              autoFocus
            />
          )}

          {current.type === 'WRITING' && (
            <div>
              <textarea
                value={answers[current.id] ?? ''}
                onChange={(e) => setAnswer(current.id, e.target.value)}
                className="input min-h-[200px] resize-y text-sm"
                placeholder="Rédigez votre réponse ici…"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {(answers[current.id] ?? '').length} caractères
              </p>
            </div>
          )}

          {current.type === 'SPEAKING' && (
            <AudioRecorder
              onRecorded={(blob) => setAudioAnswers((prev) => ({ ...prev, [current.id]: blob }))}
            />
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="btn-secondary flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>

        <div className="flex gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={clsx(
                'w-7 h-7 rounded-full text-xs font-medium transition-all',
                i === currentIdx ? 'bg-brand-600 text-white' :
                answers[questions[i].id] !== undefined ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-400 hover:bg-slate-200',
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentIdx < questions.length - 1 ? (
          <button onClick={saveAndNext} className="btn-primary flex items-center gap-2">
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completeMutation.isPending}
            className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Soumettre le test
          </button>
        )}
      </div>
    </div>
  );
}
