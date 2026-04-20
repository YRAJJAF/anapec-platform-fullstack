'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Clock, ChevronRight, ChevronLeft, CheckCircle, Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { testsApi, sessionsApi } from '@/lib/api';

type QType = 'MULTIPLE_CHOICE'|'TRUE_FALSE'|'FILL_IN_BLANK'|'READING_COMPREHENSION'|'LISTENING_COMPREHENSION'|'WRITING'|'SPEAKING'|'ORDERING';

function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const id = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);
  const m = Math.floor(remaining / 60), s = remaining % 60;
  const urgent = remaining < 300;
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold ${urgent ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-700'}`}>
      <Clock size={16} className={urgent ? 'animate-pulse' : ''}/>
      {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </div>
  );
}

function AudioRecorder({ onRecorded }: { onRecorded: (blob: Blob) => void }) {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecorded(blob);
        setRecorded(true);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
    } catch { toast.error('Impossible d\'accéder au microphone'); }
  };

  const stop = () => { mediaRef.current?.stop(); setRecording(false); };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-2xl">
      {recorded ? (
        <div className="flex items-center gap-2 text-emerald-600 font-medium"><CheckCircle size={20}/> Réponse enregistrée</div>
      ) : (
        <>
          <button
            onClick={recording ? stop : start}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${recording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-brand-600 hover:bg-brand-700'} text-white`}
          >
            {recording ? <MicOff size={28}/> : <Mic size={28}/>}
          </button>
          <p className="text-sm text-gray-500">{recording ? 'Enregistrement... Cliquez pour arrêter' : 'Cliquez pour commencer à parler'}</p>
        </>
      )}
    </div>
  );
}

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [audioBlobs, setAudioBlobs] = useState<Record<string, Blob>>({});
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);

  const { data: testData, isLoading } = useQuery({
    queryKey: ['test-candidate', id],
    queryFn: () => testsApi.getForCandidate(id) as any,
    enabled: !!id,
  });

  const test = (testData as any)?.data;
  const questions: any[] = test?.questions ?? [];
  const current = questions[currentIdx];

  const startTest = async () => {
    try {
      const res = await sessionsApi.start(id) as any;
      setSessionId(res.data.session.id);
      setStarted(true);
    } catch { toast.error('Erreur lors du démarrage du test'); }
  };

  const selectAnswer = (qId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const submitCurrent = async () => {
    if (!sessionId || !current) return;
    const answer = answers[current.id];
    const blob = audioBlobs[current.id];
    if (!answer && !blob && !['WRITING','SPEAKING'].includes(current.type)) return;

    try {
      if (blob) {
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');
        fd.append('questionId', current.id);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/answer/audio`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          body: fd,
        });
      } else {
        await sessionsApi.submitAnswer(sessionId, { questionId: current.id, userAnswer: answer });
      }
    } catch { /* silent — will submit at completion */ }
  };

  const goNext = async () => {
    await submitCurrent();
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
  };

  const goPrev = () => { if (currentIdx > 0) setCurrentIdx(i => i - 1); };

  const finishTest = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      await submitCurrent();
      const res = await sessionsApi.complete(sessionId) as any;
      router.push(`/test/result/${sessionId}`);
    } catch { toast.error('Erreur lors de la soumission'); setSubmitting(false); }
  };

  const handleExpire = useCallback(() => { if (sessionId) finishTest(); }, [sessionId]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-600"/></div>;
  if (!test) return <div className="text-center py-16 text-gray-400">Test introuvable</div>;

  // Intro screen
  if (!started) return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card text-center space-y-4">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-2xl font-bold text-brand-600">{test.cefrTarget}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
        {test.description && <p className="text-gray-500">{test.description}</p>}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-2xl font-bold text-gray-900">{questions.length}</p><p className="text-xs text-gray-500">Questions</p></div>
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-2xl font-bold text-gray-900">{test.durationMinutes}</p><p className="text-xs text-gray-500">Minutes</p></div>
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-2xl font-bold text-gray-900">{test.passingScore}%</p><p className="text-xs text-gray-500">Seuil réussite</p></div>
        </div>
        {test.instructions && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 text-left">
            <p className="font-semibold mb-1 flex items-center gap-2"><AlertCircle size={16}/> Instructions</p>
            <p>{test.instructions}</p>
          </div>
        )}
        <button onClick={startTest} className="btn-primary px-8 py-3 text-base">Commencer le test</button>
      </div>
    </div>
  );

  const opts = current?.options as any;
  const optionList: string[] = Array.isArray(opts) ? opts : (opts?.options ?? []);
  const isLast = currentIdx === questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{test.title}</p>
          <p className="font-semibold text-gray-900">Question {currentIdx + 1} / {questions.length}</p>
        </div>
        <Timer seconds={test.durationMinutes * 60} onExpire={handleExpire}/>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}/>
      </div>

      {/* Question card */}
      <div className="card space-y-6">
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{currentIdx + 1}</span>
          <div className="flex-1">
            <span className="badge bg-gray-100 text-gray-600 mb-2">{current?.type?.replace(/_/g,' ')}</span>
            <p className="text-gray-900 font-medium text-lg leading-relaxed">{current?.content}</p>
            {current?.contentAr && <p className="text-gray-500 mt-2 font-arabic text-right" dir="rtl">{current.contentAr}</p>}
          </div>
        </div>

        {/* Audio player */}
        {current?.audioUrl && (
          <audio controls src={current.audioUrl} className="w-full rounded-xl"/>
        )}

        {/* MCQ / True-False options */}
        {['MULTIPLE_CHOICE','TRUE_FALSE','READING_COMPREHENSION','LISTENING_COMPREHENSION'].includes(current?.type) && optionList.length > 0 && (
          <div className="space-y-3">
            {optionList.map((opt: string, i: number) => (
              <button key={i} onClick={() => selectAnswer(current.id, opt)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${answers[current.id] === opt ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-brand-200 hover:bg-brand-50/40'}`}>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${answers[current.id] === opt ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 text-gray-400'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-gray-800">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {/* Fill in blank / Writing */}
        {['FILL_IN_BLANK','WRITING'].includes(current?.type) && (
          <textarea
            value={answers[current.id] ?? ''}
            onChange={e => selectAnswer(current.id, e.target.value)}
            className="input min-h-[120px] resize-none"
            placeholder={current?.type === 'WRITING' ? 'Écrivez votre réponse ici...' : 'Complétez la phrase...'}
          />
        )}

        {/* Speaking */}
        {current?.type === 'SPEAKING' && (
          <AudioRecorder onRecorded={blob => setAudioBlobs(prev => ({ ...prev, [current.id]: blob }))}/>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={goPrev} disabled={currentIdx === 0} className="btn-ghost" >
          <ChevronLeft size={18}/>Précédent
        </button>
        <div className="flex gap-1">
          {questions.map((_: any, i: number) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIdx ? 'bg-brand-600 w-6' : answers[questions[i]?.id] ? 'bg-emerald-400' : 'bg-gray-200'}`}/>
          ))}
        </div>
        {isLast ? (
          <button onClick={finishTest} disabled={submitting} className="btn-primary">
            {submitting && <Loader2 size={16} className="animate-spin"/>}
            {submitting ? 'Envoi...' : 'Terminer le test'}
          </button>
        ) : (
          <button onClick={goNext} className="btn-primary">
            Suivant <ChevronRight size={18}/>
          </button>
        )}
      </div>
    </div>
  );
}
