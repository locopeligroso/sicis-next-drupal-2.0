import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_MAX = 500;
const RICHIESTA_MAX = 2000;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeField(value: unknown, maxLen: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  if (value.length > maxLen) return null;
  return escapeHtml(value.trim());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nome, cognome, nazione, professione, richiesta, privacy } =
      body;

    if (!email || !nome || !cognome || !privacy) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 },
      );
    }

    // Email format validation
    if (
      typeof email !== 'string' ||
      !EMAIL_REGEX.test(email) ||
      email.length > FIELD_MAX
    ) {
      return NextResponse.json(
        { error: 'Formato email non valido' },
        { status: 400 },
      );
    }

    // Length validation for required fields
    if (
      typeof nome !== 'string' ||
      nome.length > FIELD_MAX ||
      typeof cognome !== 'string' ||
      cognome.length > FIELD_MAX
    ) {
      return NextResponse.json(
        { error: 'Campo troppo lungo' },
        { status: 400 },
      );
    }

    if (
      richiesta !== undefined &&
      richiesta !== null &&
      (typeof richiesta !== 'string' || richiesta.length > RICHIESTA_MAX)
    ) {
      return NextResponse.json(
        { error: 'Campo richiesta troppo lungo' },
        { status: 400 },
      );
    }

    const sendTo = process.env.SEND_TO_EMAIL;
    if (!sendTo) {
      return NextResponse.json(
        { error: 'SEND_TO_EMAIL not configured' },
        { status: 500 },
      );
    }

    // Sanitize all fields before HTML interpolation
    const safeEmail = escapeHtml(email.trim());
    const safeNome = escapeHtml(nome.trim());
    const safeCognome = escapeHtml(cognome.trim());
    const safeNazione = sanitizeField(nazione, FIELD_MAX) ?? '-';
    const safeProfessione = sanitizeField(professione, FIELD_MAX) ?? '-';
    const safeRichiesta = sanitizeField(richiesta, RICHIESTA_MAX) ?? '-';

    const { error } = await resend.emails.send({
      from: 'Sicis <noreply@sicis-stage.com>',
      to: sendTo,
      subject: 'Richiesta informazioni generali',
      html: `
        <h2>Richiesta informazioni generali</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${safeEmail}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nome</td><td style="padding:8px;border:1px solid #ddd">${safeNome}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Cognome</td><td style="padding:8px;border:1px solid #ddd">${safeCognome}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nazione</td><td style="padding:8px;border:1px solid #ddd">${safeNazione}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Professione</td><td style="padding:8px;border:1px solid #ddd">${safeProfessione}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Richiesta</td><td style="padding:8px;border:1px solid #ddd">${safeRichiesta}</td></tr>
        </table>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 },
    );
  }
}
