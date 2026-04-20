'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Globe, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const REGIONS = ['Casablanca-Settat','Rabat-Salé-Kénitra','Marrakech-Safi','Fès-Meknès','Tanger-Tétouan-Al Hoceïma','Oriental','Souss-Massa','Béni Mellal-Khénifra','Drâa-Tafilalet','Laâyoune-Sakia El Hamra','Guelmim-Oued Noun','Dakhla-Oued Ed-Dahab'];

const schema = z.object({
  firstName: z.string().min(2,'Prénom requis'),
  lastName: z.string().min(2,'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8,'8 caractères minimum'),
  cin: z.string().optional(),
  phone: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  agency: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: doRegister, isLoading } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await doRegister(data);
      toast.success('Compte créé avec succès !');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message?.error ?? 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white mb-4">
            <Globe size={28}/>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Créer un compte</h2>
          <p className="mt-2 text-gray-500">Rejoignez la plateforme linguistique ANAPEC</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom</label>
                <input {...register('firstName')} className="input" placeholder="Ahmed"/>
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Nom</label>
                <input {...register('lastName')} className="input" placeholder="Benali"/>
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="votre@email.ma"/>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input {...register('password')} type={showPwd?'text':'password'} className="input pr-10" placeholder="8 caractères minimum"/>
                <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">CIN <span className="text-gray-400">(optionnel)</span></label>
                <input {...register('cin')} className="input" placeholder="BJ123456"/>
              </div>
              <div>
                <label className="label">Téléphone <span className="text-gray-400">(optionnel)</span></label>
                <input {...register('phone')} className="input" placeholder="0600000000"/>
              </div>
            </div>
            <div>
              <label className="label">Région <span className="text-gray-400">(optionnel)</span></label>
              <select {...register('region')} className="input">
                <option value="">Sélectionner une région</option>
                {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ville <span className="text-gray-400">(optionnel)</span></label>
                <input {...register('city')} className="input" placeholder="Casablanca"/>
              </div>
              <div>
                <label className="label">Agence ANAPEC <span className="text-gray-400">(optionnel)</span></label>
                <input {...register('agency')} className="input" placeholder="Agence Maarif"/>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 mt-2">
              {isLoading && <Loader2 size={18} className="animate-spin"/>}
              {isLoading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
          <div className="border-t pt-5 mt-5 text-center">
            <p className="text-sm text-gray-500">Déjà un compte ? <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">Se connecter</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
