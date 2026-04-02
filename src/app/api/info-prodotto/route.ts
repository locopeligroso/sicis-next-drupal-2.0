import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      nome,
      cognome,
      nazione,
      professione,
      prodotto,
      richiesta,
      privacy,
    } = body;

    if (!email || !nome || !cognome || !privacy) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
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

    const { error } = await resend.emails.send({
      from: 'Sicis <noreply@sicis-stage.com>',
      to: sendTo,
      subject: `Info prodotto: ${prodotto || 'Prodotto non specificato'}`,
      html: `
        <h2>Nuova richiesta info prodotto</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nome</td><td style="padding:8px;border:1px solid #ddd">${nome}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Cognome</td><td style="padding:8px;border:1px solid #ddd">${cognome}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nazione</td><td style="padding:8px;border:1px solid #ddd">${nazione || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Professione</td><td style="padding:8px;border:1px solid #ddd">${professione || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Prodotto</td><td style="padding:8px;border:1px solid #ddd">${prodotto || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Richiesta</td><td style="padding:8px;border:1px solid #ddd">${richiesta || '-'}</td></tr>
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
