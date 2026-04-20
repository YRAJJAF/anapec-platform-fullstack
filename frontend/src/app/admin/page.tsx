'use client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, FlaskConical, Award, TrendingUp, BarChart3, Clock, Loader2 } from 'lucide-react';
import { reportingApi } from '@/lib/api';

const CEFR_COLORS: Record<string,string> = { A1:'#10b981', A2:'#14b8a6', B1:'#3b82f6', B2:'#6366f1', C1:'#8b5cf6', C2:'#ec4899' };

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={22}/></div>
      <div><p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p><p className="text-sm text-gray-500 mt-0.5">{label}</p>{sub && <p className="text-xs text-emerald-600 mt-0.5">{sub}</p>}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: ov, isLoading } = useQuery({ queryKey:['admin-overview'], queryFn:()=>reportingApi.getOverview() as any, refetchInterval:60000 });
  const { data: eng } = useQuery({ queryKey:['engagement'], queryFn:()=>reportingApi.getEngagement(30) as any });

  const stats = (ov as any)?.data?.totals ?? {};
  const cefrDist: any[] = (ov as any)?.data?.cefrDistribution ?? [];
  const recent: any[] = (ov as any)?.data?.recentActivity ?? [];

  const cefrData = cefrDist.map((d:any)=>({ name:d.cefrResult??'N/A', value:Number(d._count), color:CEFR_COLORS[d.cefrResult??'']??'#94a3b8' }));

  const sessions = ((eng as any)?.data?.dailySessions??[]).map((d:any)=>({ date:new Date(d.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}), sessions:Number(d.count) }));
  const signups  = ((eng as any)?.data?.dailySignups??[]).map((d:any)=>({ date:new Date(d.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}), inscriptions:Number(d.count) }));
  const engData = sessions.map((s:any,i:number)=>({ date:s.date, sessions:s.sessions, inscriptions:signups[i]?.inscriptions??0 }));

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-600"/></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1><p className="text-gray-500 mt-1">Tableau de bord administratif</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Candidats inscrits" value={stats.users?.toLocaleString('fr-FR')} sub={`${stats.activeUsers??0} actifs`} color="bg-brand-50 text-brand-600"/>
        <StatCard icon={FlaskConical} label="Tests complétés" value={stats.completedSessions?.toLocaleString('fr-FR')} sub={`${stats.completionRate??0}% complétion`} color="bg-blue-50 text-blue-600"/>
        <StatCard icon={Award} label="Certificats émis" value={stats.certificates?.toLocaleString('fr-FR')} color="bg-amber-50 text-amber-600"/>
        <StatCard icon={TrendingUp} label="Score moyen" value={`${stats.avgScore??0}%`} color="bg-emerald-50 text-emerald-600"/>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BarChart3 size={18}/> Distribution CECRL</h2>
          {cefrData.length === 0 ? <div className="flex items-center justify-center h-52 text-gray-300 text-sm">Pas encore de données</div> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={cefrData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {cefrData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>[`${v} candidats`,'Niveau']}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {cefrData.map((d,i)=>(
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{background:d.color}}/><span className="font-medium text-gray-700">{d.name}</span></div>
                    <span className="text-gray-500 font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp size={18}/> Activité (30 jours)</h2>
          {engData.length === 0 ? <div className="flex items-center justify-center h-52 text-gray-300 text-sm">Pas encore de données</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={engData} margin={{top:5,right:20,bottom:5,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="date" tick={{fontSize:11}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                <Tooltip/>
                <Legend wrapperStyle={{fontSize:'12px'}}/>
                <Line type="monotone" dataKey="sessions" name="Tests" stroke="#1A5F7A" strokeWidth={2} dot={false} activeDot={{r:4}}/>
                <Line type="monotone" dataKey="inscriptions" name="Inscriptions" stroke="#C9A84C" strokeWidth={2} dot={false} activeDot={{r:4}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {cefrData.length > 0 && (
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BarChart3 size={18}/> Candidats par niveau CECRL</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cefrData} margin={{top:5,right:20,bottom:5,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:13,fontWeight:600}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}/>
              <Tooltip cursor={{fill:'#f8fafc'}}/>
              <Bar dataKey="value" name="Candidats" radius={[8,8,0,0]}>
                {cefrData.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Clock size={18}/> Activité récente</h2>
        {recent.length === 0 ? <p className="text-gray-400 text-sm py-4 text-center">Aucune activité récente</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-3 font-medium">Candidat</th>
                <th className="text-left pb-3 font-medium">Langue</th>
                <th className="text-left pb-3 font-medium">Niveau</th>
                <th className="text-left pb-3 font-medium">Score</th>
                <th className="text-left pb-3 font-medium">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((a:any)=>(
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-medium text-gray-900">{a.user?.firstName} {a.user?.lastName}</td>
                    <td className="py-3 text-gray-600">{a.test?.language?.name??'—'}</td>
                    <td className="py-3">{a.cefrResult ? <span className="badge text-xs px-2 py-0.5 rounded-full font-semibold" style={{background:CEFR_COLORS[a.cefrResult]+'20',color:CEFR_COLORS[a.cefrResult]}}>{a.cefrResult}</span> : '—'}</td>
                    <td className="py-3"><span className={`font-semibold ${(a.score??0)>=60?'text-emerald-600':'text-red-500'}`}>{Math.round(a.score??0)}%</span></td>
                    <td className="py-3 text-gray-400 text-xs">{a.completedAt?new Date(a.completedAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'2-digit'}):'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
