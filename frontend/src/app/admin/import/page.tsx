'use client';
import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '@/lib/api';

interface ParsedUser {
  firstName: string; lastName: string; email: string;
  cin?: string; phone?: string; region?: string; city?: string; agency?: string;
}
interface ParseError { row: number; message: string; raw: string; }

function parseCSV(content: string): { valid: ParsedUser[]; errors: ParseError[] } {
  const valid: ParsedUser[] = [];
  const errors: ParseError[] = [];
  const lines = content.replace(/^\uFEFF/, '').trim().split(/\r?\n/).slice(1);
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const cols = line.split(';').map(c => c.trim().replace(/^"|"$/g, ''));
    const [firstName, lastName, email, cin, phone, region, city, agency] = cols;
    const row = i + 2;
    if (!firstName || firstName.length < 2) { errors.push({ row, message: 'Prénom invalide', raw: line }); return; }
    if (!lastName  || lastName.length  < 2) { errors.push({ row, message: 'Nom invalide', raw: line }); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors.push({ row, message: `Email invalide: "${email}"`, raw: line }); return; }
    valid.push({ firstName, lastName, email: email.toLowerCase(), cin: cin||undefined, phone: phone||undefined, region: region||undefined, city: city||undefined, agency: agency||undefined });
  });
  return { valid, errors };
}

export default function BulkImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ valid: ParsedUser[]; errors: ParseError[] } | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const importMutation = useMutation({
    mutationFn: (users: ParsedUser[]) => usersApi.bulkImport(users) as any,
    onSuccess: (res: any) => {
      setImportResult(res.data);
      toast.success(`Import terminé : ${res.data.created} créés, ${res.data.skipped} ignorés`);
    },
    onError: () => toast.error('Erreur lors de l\'import'),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setParsed(parseCSV(content));
      setImportResult(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const downloadTemplate = () => {
    const BOM = '\uFEFF';
    const header = 'Prénom;Nom;Email;CIN;Téléphone;Région;Ville;Agence';
    const sample = [
      'Ahmed;Benali;ahmed.benali@example.ma;BJ123456;0612345678;Casablanca-Settat;Casablanca;Agence Maarif',
      'Fatima;El Fassi;fatima@example.ma;CD789012;0623456789;Rabat-Salé-Kénitra;Rabat;Agence Agdal',
    ];
    const csv = BOM + [header, ...sample].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'template-import-anapec.csv';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import de candidats</h1>
        <p className="text-gray-500 mt-1">Inscrivez des bénéficiaires en masse via fichier CSV</p>
      </div>

      {/* Instructions */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><AlertCircle size={18} className="text-amber-500"/> Instructions</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="space-y-1">
            <p className="font-medium text-gray-900">Format requis :</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-500">
              <li>Fichier CSV séparé par <strong>point-virgule (;)</strong></li>
              <li>Encodage <strong>UTF-8</strong></li>
              <li>Première ligne = en-tête (ignorée)</li>
              <li>Champs obligatoires : Prénom, Nom, Email</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-gray-900">Colonnes :</p>
            <code className="block bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-700 leading-relaxed">
              Prénom;Nom;Email;<br/>CIN;Téléphone;<br/>Région;Ville;Agence
            </code>
          </div>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary text-sm">
          <Download size={16}/> Télécharger le modèle CSV
        </button>
      </div>

      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/20 transition-all"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = ev => { setParsed(parseCSV(ev.target?.result as string)); setImportResult(null); };
            reader.readAsText(file, 'UTF-8');
          }
        }}
      >
        <Upload size={36} className="text-gray-300 mx-auto mb-3"/>
        <p className="font-medium text-gray-700">Glissez votre fichier CSV ici</p>
        <p className="text-sm text-gray-400 mt-1">ou cliquez pour parcourir</p>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile}/>
      </div>

      {/* Preview */}
      {parsed && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card bg-emerald-50 border-emerald-200 text-center">
              <p className="text-3xl font-bold text-emerald-600">{parsed.valid.length}</p>
              <p className="text-sm text-emerald-700 mt-1">Lignes valides</p>
            </div>
            <div className="card bg-red-50 border-red-100 text-center">
              <p className="text-3xl font-bold text-red-500">{parsed.errors.length}</p>
              <p className="text-sm text-red-600 mt-1">Erreurs détectées</p>
            </div>
            <div className="card bg-brand-50 border-brand-100 text-center">
              <p className="text-3xl font-bold text-brand-600">{parsed.valid.length + parsed.errors.length}</p>
              <p className="text-sm text-brand-700 mt-1">Total lignes</p>
            </div>
          </div>

          {/* Errors */}
          {parsed.errors.length > 0 && (
            <div className="card border-red-100 space-y-2">
              <h3 className="font-semibold text-red-700 flex items-center gap-2"><XCircle size={16}/> Erreurs ({parsed.errors.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parsed.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm bg-red-50 rounded-lg p-2">
                    <span className="text-red-400 font-mono text-xs flex-shrink-0">L.{e.row}</span>
                    <span className="text-red-700">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid rows preview */}
          {parsed.valid.length > 0 && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Users size={16}/> Aperçu ({Math.min(5, parsed.valid.length)} sur {parsed.valid.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-gray-500 font-medium">
                      <th className="text-left p-2">Prénom</th><th className="text-left p-2">Nom</th>
                      <th className="text-left p-2">Email</th><th className="text-left p-2">CIN</th>
                      <th className="text-left p-2">Région</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {parsed.valid.slice(0, 5).map((u, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="p-2 font-medium">{u.firstName}</td>
                        <td className="p-2">{u.lastName}</td>
                        <td className="p-2 text-gray-500 text-xs">{u.email}</td>
                        <td className="p-2 font-mono text-xs text-gray-400">{u.cin ?? '—'}</td>
                        <td className="p-2 text-xs text-gray-500">{u.region ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsed.valid.length > 5 && <p className="text-xs text-gray-400">+ {parsed.valid.length - 5} autres lignes</p>}

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => importMutation.mutate(parsed.valid)}
                  disabled={importMutation.isPending}
                  className="btn-primary"
                >
                  {importMutation.isPending && <Loader2 size={16} className="animate-spin"/>}
                  {importMutation.isPending ? 'Import en cours...' : `Importer ${parsed.valid.length} candidats`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {importResult && (
        <div className="card bg-emerald-50 border-emerald-200 space-y-2">
          <h3 className="font-semibold text-emerald-800 flex items-center gap-2"><CheckCircle size={16}/> Import terminé</h3>
          <p className="text-sm text-emerald-700"><strong>{importResult.created}</strong> candidats créés avec succès.</p>
          {importResult.skipped > 0 && <p className="text-sm text-amber-700"><strong>{importResult.skipped}</strong> ignorés (email ou CIN déjà existant).</p>}
          <p className="text-xs text-emerald-600 mt-2">Mot de passe par défaut attribué : <code className="bg-emerald-100 px-1 rounded font-mono">Anapec2024!</code> — Les candidats doivent le changer à la première connexion.</p>
        </div>
      )}
    </div>
  );
}
