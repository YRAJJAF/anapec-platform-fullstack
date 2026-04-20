'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Globe, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Requis'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      const role = useAuthStore.getState().user?.role;
      router.push(role === 'CANDIDATE' ? '/dashboard' : '/admin');
    } catch (err: any) {
      toast.error(err?.message?.error ?? 'Identifiants invalides');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center space-y-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 mx-auto">
            <Globe size={40} />
          </div>
          <h1 className="text-4xl font-bold">Plateforme<br />Linguistique ANAPEC</h1>
          <p className="text-brand-100 text-lg leading-relaxed">
            Évaluez votre niveau, accédez à des parcours personnalisés et obtenez votre certification CECRL.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {['A1','A2','B1','B2','C1','C2'].map(l=>(
              <div key={l} className="bg-white/10 rounded-xl py-3 text-center font-bold text-lg">{l}</div>
            ))}
          </div>
          <p className="text-brand-200 text-sm">8 langues · 100 000 bénéficiaires · CECRL</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Connexion</h2>
            <p className="mt-2 text-gray-500">Accédez à votre espace personnel</p>
          </div>
          <div className="card space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" placeholder="votre@email.ma" className="input" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <div className="relative">
                  <input {...register('password')} type={showPwd?'text':'password'} placeholder="••••••••" className="input pr-10" />
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-sm text-brand-600 hover:underline">Mot de passe oublié ?</Link>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                {isLoading && <Loader2 size={18} className="animate-spin"/>}
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
            <div className="border-t pt-5 text-center">
              <p className="text-sm text-gray-500">Pas de compte ? <Link href="/auth/register" className="text-brand-600 font-medium hover:underline">S'inscrire</Link></p>
            </div>
          </div>
          <div className="card bg-amber-50 border-amber-100 space-y-2">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Comptes démo</p>
            <div className="space-y-1 text-xs text-amber-700">
              <p>👤 Candidat : candidat@demo.ma / Demo1234!</p>
              <p>🔧 Admin : admin@demo.ma / Demo1234!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
