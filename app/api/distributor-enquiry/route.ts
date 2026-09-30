import { NextResponse } from 'next/server';

/**
 * POST /api/distributor-enquiry
 *
 * Receives form data from the browser and forwards it to FormSubmit
 * server-side, avoiding CORS issues that occur with direct browser requests.
 *
 * The browser must NEVER call FormSubmit directly.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string;
      email?: string;
      phone?: string;
      source?: string;
      productContext?: string;
      requirements?: string;
    };

    // ── Validate required fields ──────────────────────────────────────
    const { name, email, phone, source, productContext, requirements } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: 'Name is required (minimum 2 characters).' },
        { status: 400 },
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { ok: false, error: 'A valid email address is required.' },
        { status: 400 },
      );
    }

    const cleanedPhone = (phone || '').replace(/[\s\-().]/g, '');
    if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(cleanedPhone)) {
      return NextResponse.json(
        { ok: false, error: 'A valid Indian phone number is required.' },
        { status: 400 },
      );
    }

    // ── Generate Reference ID ─────────────────────────────────────────
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const referenceId = `INV-${suffix}`;

    // ── Format timestamp ──────────────────────────────────────────────
    const timestamp =
      new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST';

    // ── Build FormSubmit payload ───────────────────────────────────────
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = (phone || '').trim();

    const formsubmitPayload = {
      _subject: `New INVolt Distributor Enquiry — ${referenceId}`,
      _template: 'table',
      _captcha: 'false',
      _replyto: trimmedEmail,
      'Reference ID': referenceId,
      Name: trimmedName,
      Email: trimmedEmail,
      Phone: trimmedPhone,
      Source: source || 'INVolt Website',
      'Submission Time': timestamp,
      'Product / Context': productContext || 'Distributor Network',
      Requirements: requirements || 'Distributor enquiry',
    };

    // ── Send to FormSubmit server-side ─────────────────────────────────
    const recipientEmail = (
      process.env.ENQUIRY_RECIPIENT_EMAIL || 'involtintegrated@gmail.com'
    ).trim();

    const formsubmitUrl = `https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`;

    // FormSubmit requires Origin + Referer to identify the submission source.
    // Derive it from the incoming request so it works on any deployment domain.
    const requestOrigin = new URL(request.url).origin;

    const fsResponse = await fetch(formsubmitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: requestOrigin,
        Referer: `${requestOrigin}/`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify(formsubmitPayload),
    });

    // ── Read the raw response body once ───────────────────────────────
    const rawBody = await fsResponse.text();

    let fsData: Record<string, unknown> | null = null;
    try {
      fsData = JSON.parse(rawBody);
    } catch {
      // Response was not JSON — logged below
    }

    const isSuccess =
      fsResponse.ok &&
      fsData &&
      (fsData.success === 'true' || fsData.success === true);

    const isActivationPending =
      fsData &&
      typeof fsData.message === 'string' &&
      (fsData.message as string).toLowerCase().includes('activation');

    if (isSuccess || isActivationPending) {
      if (isActivationPending) {
        console.log(
          `[distributor-enquiry] FormSubmit activation email sent to ${recipientEmail}. ` +
            'Complete first-time activation to receive future leads directly.',
        );
      }

      return NextResponse.json({
        ok: true,
        referenceId,
        activationPending: !!isActivationPending,
      });
    }

    // ── FormSubmit error — log full details server-side ────────────────
    console.error('[distributor-enquiry] FormSubmit rejected the submission.');
    console.error(`[distributor-enquiry]   Status : ${fsResponse.status}`);
    console.error(`[distributor-enquiry]   Headers: ${JSON.stringify(Object.fromEntries(fsResponse.headers.entries()))}`);
    console.error(`[distributor-enquiry]   Body   : ${rawBody}`);

    return NextResponse.json(
      {
        ok: false,
        error:
          'The email service rejected the submission. Please try again shortly.',
        // Expose status code for diagnostics but NOT the raw body / internals
        statusCode: fsResponse.status,
      },
      { status: 502 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[distributor-enquiry] Unexpected server error:', message);
    return NextResponse.json(
      { ok: false, error: 'An unexpected server error occurred.' },
      { status: 500 },
    );
  }
}
