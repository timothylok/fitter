export default function WelcomeEmail(): string {
  return `<!DOCTYPE html>
<html>
  <body style="background-color:#f7f7f7;padding:20px;margin:0;">
    <div style="background-color:#ffffff;padding:24px;border-radius:8px;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="font-size:22px;margin:0 0 16px;">Welcome to fittertrack.com</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Thanks for signing up &#8212; I&#8217;m excited to have you here.</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">I built fittertrack.com after seeing so many people still using paper forms to track workouts. This app is designed to be simple, secure, and genuinely helpful.</p>
      <p style="font-size:15px;line-height:1.6;margin:16px 0 12px;">
        &#8226; No passwords &#8212; you&#8217;ll receive a one&#8209;time magic link each time<br>
        &#8226; Privacy&#8209;first &#8212; no personal details stored<br>
        &#8226; Easy workout tracking<br>
        &#8226; Trainer&#8209;friendly (reports coming soon)<br>
        &#8226; Completely free
      </p>
      <p style="font-size:15px;line-height:1.6;margin:16px 0 0;">Thanks again for joining &#8212; I hope this helps you train smarter.</p>
      <p style="font-size:15px;margin:24px 0 0;">Tim Lok</p>
    </div>
  </body>
</html>`
}
