import { resend } from '@/lib/resend'

/**
 * Sends a 6-digit login code via plain text email.
 * Plain text only — no HTML links — so Outlook Safe Links cannot invalidate it.
 * To swap email providers, change this file only.
 */
export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await resend.emails.send({
    from: 'Tim Lok <tim@fittertrack.com>',
    to: email,
    subject: 'Your Fitter login code',
    // Plain text fallback
    text: [
      `Your Fitter login code is: ${otp}`,
      '',
      'This code expires in 10 minutes.',
      '',
      'If you did not request this, you can safely ignore this email.',
      '',
      '— Fitter',
    ].join('\n'),
    // HTML body — no links, just the code. Multipart improves deliverability.
    html: `<!DOCTYPE html>
<html>
  <body style="background-color:#f7f7f7;padding:20px;margin:0;">
    <div style="background-color:#ffffff;padding:24px;border-radius:8px;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="font-size:22px;margin:0 0 16px;">Your login code</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Use the code below to sign in to fittertrack.com. It expires in 10 minutes.</p>
      <div style="background-color:#f7f7f7;border-radius:8px;padding:20px;text-align:center;margin:0 0 20px;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;font-family:monospace;">${otp}</span>
      </div>
      <p style="font-size:13px;color:#888;margin:0;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  </body>
</html>`,
  })

  return error ? { success: false, error: error.message } : { success: true }
}
