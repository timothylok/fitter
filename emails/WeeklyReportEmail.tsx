import type { WeeklyKPIs } from '@/lib/types'

interface Props {
  name: string
  weekStart: string
  weekEnd: string
  kpis: WeeklyKPIs
}

export default function WeeklyReportEmail({ name, weekStart, weekEnd, kpis }: Props): string {
  const volumeKg = kpis.totalVolume.toLocaleString()
  return `<!DOCTYPE html>
<html>
  <body style="background-color:#f7f7f7;padding:20px;margin:0;">
    <div style="background-color:#ffffff;padding:24px;border-radius:8px;font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="font-size:22px;margin:0 0 4px;">Your weekly summary</h1>
      <p style="font-size:13px;color:#888;margin:0 0 20px;">${weekStart} &#8212; ${weekEnd}</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Hi ${name}, here&#8217;s how your training went last week.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        <tr>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:13px;color:#555;">Days trained</td>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:18px;font-weight:bold;text-align:right;">${kpis.frequency}</td>
        </tr>
        <tr><td colspan="2" style="padding:2px;"></td></tr>
        <tr>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:13px;color:#555;">Total sets</td>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:18px;font-weight:bold;text-align:right;">${kpis.totalSets}</td>
        </tr>
        <tr><td colspan="2" style="padding:2px;"></td></tr>
        <tr>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:13px;color:#555;">Total volume</td>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:18px;font-weight:bold;text-align:right;">${volumeKg} kg</td>
        </tr>
        <tr><td colspan="2" style="padding:2px;"></td></tr>
        <tr>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:13px;color:#555;">Streak</td>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:18px;font-weight:bold;text-align:right;">${kpis.streak} day${kpis.streak === 1 ? '' : 's'}</td>
        </tr>
        <tr><td colspan="2" style="padding:2px;"></td></tr>
        <tr>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:13px;color:#555;">Goal progress</td>
          <td style="padding:12px 16px;background:#f7f7f7;border-radius:6px;font-size:18px;font-weight:bold;text-align:right;">${kpis.goalProgress}%</td>
        </tr>
      </table>
      <p style="font-size:15px;line-height:1.6;margin:0 0 0;">Keep it up &#8212; see you next week.</p>
      <p style="font-size:15px;margin:24px 0 0;">Tim Lok</p>
    </div>
  </body>
</html>`
}
