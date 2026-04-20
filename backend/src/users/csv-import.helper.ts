/**
 * CSV Import Helper for ANAPEC bulk user registration
 * Expected CSV format (semicolon-separated, UTF-8 BOM):
 * Prénom;Nom;Email;CIN;Téléphone;Région;Ville;Agence
 */

export interface CsvUserRow {
  firstName: string;
  lastName: string;
  email: string;
  cin?: string;
  phone?: string;
  region?: string;
  city?: string;
  agency?: string;
}

export interface CsvParseResult {
  valid: CsvUserRow[];
  errors: Array<{ row: number; message: string; raw: string }>;
}

export function parseCsvUsers(csvContent: string): CsvParseResult {
  const valid: CsvUserRow[] = [];
  const errors: Array<{ row: number; message: string; raw: string }> = [];

  // Strip BOM if present
  const content = csvContent.replace(/^\uFEFF/, '').trim();
  const lines = content.split(/\r?\n/);

  if (lines.length < 2) {
    return { valid, errors: [{ row: 0, message: 'Fichier CSV vide ou sans données', raw: '' }] };
  }

  // Skip header row
  const dataRows = lines.slice(1);

  for (let i = 0; i < dataRows.length; i++) {
    const line = dataRows[i].trim();
    if (!line) continue;

    const cols = line.split(';').map(c => c.trim().replace(/^"|"$/g, ''));
    const rowNum = i + 2;

    if (cols.length < 3) {
      errors.push({ row: rowNum, message: 'Ligne incomplète (Prénom, Nom et Email requis)', raw: line });
      continue;
    }

    const [firstName, lastName, email, cin, phone, region, city, agency] = cols;

    if (!firstName || firstName.length < 2) {
      errors.push({ row: rowNum, message: 'Prénom invalide (minimum 2 caractères)', raw: line });
      continue;
    }

    if (!lastName || lastName.length < 2) {
      errors.push({ row: rowNum, message: 'Nom invalide (minimum 2 caractères)', raw: line });
      continue;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push({ row: rowNum, message: `Email invalide: "${email}"`, raw: line });
      continue;
    }

    valid.push({ firstName, lastName, email: email.toLowerCase(), cin: cin || undefined, phone: phone || undefined, region: region || undefined, city: city || undefined, agency: agency || undefined });
  }

  return { valid, errors };
}

/** Generate sample CSV content for download */
export function generateCsvTemplate(): string {
  const BOM = '\uFEFF';
  const header = 'Prénom;Nom;Email;CIN;Téléphone;Région;Ville;Agence';
  const sample = [
    'Ahmed;Benali;ahmed.benali@example.ma;BJ123456;0612345678;Casablanca-Settat;Casablanca;Agence Maarif',
    'Fatima;El Fassi;fatima.elfassi@example.ma;CD789012;0623456789;Rabat-Salé-Kénitra;Rabat;Agence Agdal',
    'Karim;Oujda;karim.oujda@example.ma;;;Oriental;Oujda;',
  ];
  return BOM + [header, ...sample].join('\n');
}
