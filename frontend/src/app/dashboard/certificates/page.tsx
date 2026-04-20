'use client';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { certificatesApi } from '@/lib/api';

const CEFR_COLOR: Record<string, string> = { A1:'border-emerald-200 bg-emerald-50', A2:'border-teal-200 bg-teal-50', B1:'border-blue-200 bg-blue-50', B2:'border-indigo-200 bg-indigo-50', C1:'border-purple-200 bg-purple-50', C2:'border-pink-200 bg-pink-50' };
const CEFR_BADGE: Record<string, string> = { A1:'bg-emerald-100 text-emerald-800', A2:'bg-teal-100 text-teal-800', B1:'bg-blue-100 text-blue-800', B2:'bg-indigo-100 text-indigo-800', C1:'bg-purple-100 text-purple-800', C2:'bg-pink-100 text-pink-800' };
const LANG_NAMES: Record<string, string> = { fr:'Français', de:'Allemand', en:'Anglais', es:'Espagnol', it:'Italien', pt:'Portugais', nl:'Néerlandais', ar:'Arabe classique' };

export default function CertificatesPage() {
  const { data, isLoading } = useQuery({ queryKey:['certificates'], queryFn:()=>certificatesApi.getMyCertificates() as any });
  const certs: any[] = (data as any)?.data ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes certificats</h1>
        <p className="text-gray-500 mt-1">Vos attestations de niveau CECRL obtenues sur la plateforme ANAPEC</p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={32} className="animate-spin text-brand-600"/></div>
      ) : certs.length === 0 ? (
        <div className="card text-center py-16 space-y-4">
          <Award size={56} className="text-gray-200 mx-auto"/>
          <div><p className="text-gray-700 font-semibold text-lg">Aucun certificat pour l'instant</p><p className="text-gray-500 text-sm mt-1">Passez un test et obtenez votre attestation automatiquement.</p></div>
          <a href="/test" className="btn-primary inline-flex mt-2">Passer un test</a>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <CheckCircle size={20} className="text-amber-600 flex-shrink-0"/>
            <p className="text-sm text-amber-800">Vous avez obtenu <strong>{certs.length} certificat{certs.length>1?'s':''}</strong>. Conformes au CECRL.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {certs.map((cert: any) => (
              <div key={cert.id} className={`card border-2 ${CEFR_COLOR[cert.cefrLevel]??'border-gray-200 bg-gray-50'} flex flex-col gap-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm"><Award size={24} className="text-amber-500"/></div>
                    <div><p className="font-bold text-gray-900">{LANG_NAMES[cert.language]??cert.language}</p><span className={`badge ${CEFR_BADGE[cert.cefrLevel]??'bg-gray-100 text-gray-700'}`}>Niveau {cert.cefrLevel}</span></div>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={11}/>{new Date(cert.issuedAt).toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'})}</p>
                </div>
                <div className="p-3 bg-white/60 rounded-xl text-xs text-gray-600 space-y-1">
                  <p>Score : <strong>{Math.round(cert.session?.score??0)}%</strong></p>
                  <p>Test : {cert.session?.test?.title??'—'}</p>
                  <p className="font-mono text-gray-400 truncate">ID : {cert.id}</p>
                </div>
                {cert.certificateUrl && (
                  <a href={certificatesApi.downloadUrl(cert.id)} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center">
                    <Download size={16}/>Télécharger PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
