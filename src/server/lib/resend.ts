interface ResendResponse {
  id?: string;
  message?: string;
}

export async function sendSiteNotification(
  email: string,
  subject: string,
  text: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY and RESEND_FROM_EMAIL must be configured');
  }

  const response = await globalThis.fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: globalThis.AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [email], subject, text }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as ResendResponse;
    throw new Error(`Resend rejected the notification email (${response.status}): ${result.message || 'provider error'}`);
  }
}

export async function sendPasswordResetCode(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY and RESEND_FROM_EMAIL must be configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Admin password reset',
      text: [
        'Use this password reset code to change your admin password:',
        '',
        code,
        '',
        'This code expires in 15 minutes. If you did not request this change, you can ignore this email.',
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as ResendResponse;
    throw new Error(`Resend rejected the password reset email (${response.status}): ${result.message || 'provider error'}`);
  }
}
