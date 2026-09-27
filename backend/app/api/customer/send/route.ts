import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const allowedOrigins = [
  'http://localhost:5173',
  'https://aabharan03.vercel.app',
  'https://www.aabharan.in',
  'https://aabharan.in',
];

function getCorsHeaders(origin: string | null) {
  const isAllowed = !!origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await request.json();

    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const phone = String(body?.phone || '').trim();
    const message = String(body?.message || '').trim();

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Name, email, phone number and message are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedPhone = phone.replace(/\\D/g, '');

    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const emailUser = process.env.EMAIL_USER;
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || emailUser;

    if (!emailUser || !emailAppPassword || !adminEmail) {
      console.error('Missing email environment variables.');

      return NextResponse.json(
        { error: 'Email service is not configured.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `"Aabharan Website" <${emailUser}>`,
      to: adminEmail,
      replyTo: email,
      subject: `New Contact Message from ${name}`,
      text: [
        'New contact message received from Aabharan website.',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        '',
        'Message:',
        message,
      ].join('\\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827">
          <div style="background:#04091e;padding:24px;border-radius:16px 16px 0 0">
            <h2 style="margin:0;color:#ffffff">New Contact Message</h2>
            <p style="margin:6px 0 0;color:#d1d5db">Aabharan Website</p>
          </div>

          <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 16px 16px">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;font-weight:700;width:120px">Name</td>
                <td style="padding:8px 0">${escapeHtml(name)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:700">Email</td>
                <td style="padding:8px 0">${escapeHtml(email)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:700">Phone</td>
                <td style="padding:8px 0">${escapeHtml(phone)}</td>
              </tr>
            </table>

            <div style="margin-top:20px;padding:16px;background:#f9f7ee;border-radius:12px">
              <div style="font-weight:700;margin-bottom:8px">Message</div>
              <div style="white-space:pre-wrap;line-height:1.6">${escapeHtml(message)}</div>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'Message sent successfully.' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('CONTACT API ERROR:', error);

    return NextResponse.json(
      { error: 'Unable to send your message right now. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
