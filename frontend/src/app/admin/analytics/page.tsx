'use client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, MapPin, Users, BarChart3, Loader2 } from 'lucide-react';
import { reportingApi } from '@/lib/api';

const CEFR_COLORS: Record<string,string> = { A1:'#10b981', A2:'#14b8a6', B1:'#3b82f6', B2:'#6366f1', C1:'#8b5cf6', C2:'#ec4899' };

export default function AnalyticsPage() {
  const { data: ov } = useQuery({ queryKey:['admin-overview'], queryFn:()=>reportingApi.getOverview() as any });
  const { data: eng30 } = useQuery({ queryKey:['engagement-30'], queryFn:()=>reportingApi.getEngagement(30) as any });
  const { data: eng7 }  = useQuery({ queryKey:['engagement-7'],  queryFn:()=>reportingApi.getEngagement(7)  as any });

  const cefrDist: any[] = ((ov as any)?.data?.cefrDistribution ?? []).map((d:any) => ({
    name: d.cefrResult ?? 'N/A',
    Candidats: Number(d._count),
    fill: CEFR_COLORS[d.cefrResult ?? ''] ?? '#94a3b8',
  }));

  const daily30 = ((eng30 as any)?.data?.dailySessions ?? []).map((d:any,i:number) => ({
    date: new Date(d.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}),
    Tests: Number(d.count),
    Inscriptions: Number(((eng30 as any)?.data?.dailySignups ?? [])[i]?.count ?? 0),
  }));

  const stats = (ov as any)?.data?.totals ?? {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytiques</h1>
        <p className="text-gray-500 mt-1">Données détaillées de la plateforme</p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Taux de complétion', value:`${stats.completionRate ?? 0}%`, icon:TrendingUp, color:'bg-emerald-50 text-emerald-600' },
          { label:'Score moyen global', value:`${stats.avgScore ?? 0}%`, icon:BarChart3, color:'bg-blue-50 text-blue-600' },
          { label:'Candidats actifs', value:(stats.activeUsers ?? 0).toLocaleString('fr-FR'), icon:Users, color:'bg-brand-50 text-brand-600' },
          { label:'Certificats délivrés', value:(stats.certificates ?? 0).toLocaleString('fr-FR'), icon:MapPin, color:'bg-amber-50 text-amber-600' },
        ].map((s,i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.color}`}><s.icon size={22}/></div>
            <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* CEFR distribution bar */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Distribution CECRL — tous tests confondus</h2>
        {cefrDist.length === 0
          ? <div className="flex items-center justify-center h-48 text-gray-300">Pas encore de données</div>
          : <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cefrDist} margin={{top:10,right:20,bottom:5,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:14,fontWeight:700}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                <Tooltip cursor={{fill:'#f8fafc'}} formatter={(v:any)=>[`${v} candidats`,'Nombre']}/>
                <Bar dataKey="Candidats" radius={[10,10,0,0]}>
                  {cefrDist.map((e,i)=>(
                    <rect key={i}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Engagement over 30 days */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Activité quotidienne — 30 derniers jours</h2>
        </div>
        {daily30.length === 0
          ? <div className="flex items-center justify-center h-48 text-gray-300">Pas encore de données</div>
          : <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={daily30} margin={{top:10,right:20,bottom:5,left:0}}>
                <defs>
                  <linearGradient id="gTests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A5F7A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1A5F7A" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gInscrip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="date" tick={{fontSize:11}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                <Tooltip/>
                <Legend wrapperStyle={{fontSize:'12px'}}/>
                <Area type="monotone" dataKey="Tests" stroke="#1A5F7A" fill="url(#gTests)" strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="Inscriptions" stroke="#C9A84C" fill="url(#gInscrip)" strokeWidth={2} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Info card */}
      <div className="card bg-brand-50 border border-brand-100">
        <h3 className="font-semibold text-brand-800 mb-2">Rapport complet</h3>
        <p className="text-sm text-brand-600">
          Utilisez l'export CSV depuis la page Candidats pour obtenir les données détaillées par bénéficiaire.
          Les rapports mensuels sont générés automatiquement et disponibles dans MinIO sous <code className="bg-brand-100 px-1 rounded font-mono text-xs">reports/</code>.
        </p>
      </div>
    </div>
  );
}
