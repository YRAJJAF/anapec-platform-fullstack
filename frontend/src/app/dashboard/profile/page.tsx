'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, MapPin, Phone, Building2, Loader2, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { usersApi } from '@/lib/api';

const REGIONS = ['Casablanca-Settat','Rabat-Salé-Kénitra','Marrakech-Safi','Fès-Meknès',
  'Tanger-Tétouan-Al Hoceïma','Oriental','Souss-Massa','Béni Mellal-Khénifra',
  'Drâa-Tafilalet','Laâyoune-Sakia El Hamra','Guelmim-Oued Noun','Dakhla-Oued Ed-Dahab'];

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  agency: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: (user as any)?.phone ?? '',
      region: user?.region ?? '',
      city: user?.city ?? '',
      agency: user?.agency ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => usersApi.updateMe(data) as any,
    onSuccess: (res: any) => {
      setUser(res.data);
      toast.success('Profil mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Avatar card */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="badge bg-brand-50 text-brand-700 mt-1">{user?.role}</span>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <User size={18} /> Informations personnelles
        </h2>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom</label>
              <input {...register('firstName')} className="input" />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">Requis</p>}
            </div>
            <div>
              <label className="label">Nom</label>
              <input {...register('lastName')} className="input" />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">Requis</p>}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5"><Phone size={13}/> Téléphone</label>
            <input {...register('phone')} className="input" placeholder="0600000000" />
          </div>

          <div>
            <label className="label flex items-center gap-1.5"><MapPin size={13}/> Région</label>
            <select {...register('region')} className="input">
              <option value="">Sélectionner une région</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ville</label>
              <input {...register('city')} className="input" placeholder="Casablanca" />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Building2 size={13}/> Agence ANAPEC</label>
              <input {...register('agency')} className="input" placeholder="Agence Maarif" />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={!isDirty || mutation.isPending}
              className="btn-primary"
            >
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {mutation.isPending ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>

      {/* Read-only info */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900 mb-1">Informations non modifiables</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-500 text-xs">Email</p>
            <p className="font-medium text-gray-900 truncate">{user?.email}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-gray-500 text-xs">Rôle</p>
            <p className="font-medium text-gray-900">{user?.role}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Pour modifier votre email ou CIN, contactez un administrateur ANAPEC.
        </p>
      </div>
    </div>
  );
}
