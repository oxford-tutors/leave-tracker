import { Resend } from 'resend'
import { LEAVE_TYPES, hoursToDisplay } from './constants'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = 'Oxford & Cambridge Tutors <leave@oxfordtutors.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leave-ot.vercel.app'

function leaveLabel(type: string) {
  return LEAVE_TYPES.find(t => t.value === type)?.label || type
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'long', year:'numeric' })
}

export async function sendLeaveRequestEmail({ request, employee, adminEmails, blockedWarning }: {
  request: any; employee: any; adminEmails: string[]; blockedWarning?: string | null
}) {
  if (!adminEmails.length || !process.env.RESEND_API_KEY) return

  await resend.emails.send({
    from: FROM,
    to:   adminEmails,
    subject: `Leave request from ${employee?.name} — ${leaveLabel(request.leave_type)}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#202641;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#d1b378;font-size:20px;margin:0;">Oxford &amp; Cambridge Tutors</h1>
          <p style="color:#a0aec0;margin:4px 0 0;font-size:14px;">Leave Management</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#202641;margin-top:0;">New Leave Request</h2>
          <p style="color:#4a5568;">${employee?.name} has submitted a leave request:</p>
          \${blockedWarning ? \`
          <div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:12px;margin:12px 0;">
            <p style="color:#c53030;font-size:13px;margin:0;">&#9888;&#65039; \${blockedWarning}</p>
          </div>\` : ''}
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:8px 0;color:#718096;width:140px;">Type</td><td style="padding:8px 0;font-weight:600;color:#202641;">${leaveLabel(request.leave_type)}</td></tr>
            <tr><td style="padding:8px 0;color:#718096;">From</td><td style="padding:8px 0;color:#202641;">${formatDate(request.start_date)}</td></tr>
            <tr><td style="padding:8px 0;color:#718096;">To</td><td style="padding:8px 0;color:#202641;">${formatDate(request.end_date)}</td></tr>
            <tr><td style="padding:8px 0;color:#718096;">Duration</td><td style="padding:8px 0;color:#202641;">${hoursToDisplay(request.hours)}</td></tr>
            ${request.note ? `<tr><td style="padding:8px 0;color:#718096;">Note</td><td style="padding:8px 0;color:#202641;font-style:italic;">${request.note}</td></tr>` : ''}
          </table>
          <a href="${APP_URL}/dashboard/approvals" style="display:inline-block;background:#202641;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Review request →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendLeaveDecisionEmail({ request, employee, employeeEmail, action, adminName }: {
  request: any; employee: any; employeeEmail: string; action: string; adminName: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const approved = action === 'approved'

  await resend.emails.send({
    from: FROM,
    to:   employeeEmail,
    subject: `Your leave request has been ${action}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#202641;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#d1b378;font-size:20px;margin:0;">Oxford &amp; Cambridge Tutors</h1>
          <p style="color:#a0aec0;margin:4px 0 0;font-size:14px;">Leave Management</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <div style="background:${approved ? '#f0fff4' : '#fff5f5'};border:1px solid ${approved ? '#c6f6d5' : '#fed7d7'};
                      border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
            <span style="font-size:32px;">${approved ? '✅' : '❌'}</span>
            <h2 style="color:${approved ? '#276749' : '#9b2c2c'};margin:8px 0 0;">
              Request ${approved ? 'Approved' : 'Rejected'}
            </h2>
          </div>
          <p style="color:#4a5568;">Hi ${employee?.name?.split(' ')[0]},</p>
          <p style="color:#4a5568;">Your leave request has been <strong>${action}</strong> by ${adminName}.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:8px 0;color:#718096;width:140px;">Type</td><td style="padding:8px 0;font-weight:600;color:#202641;">${leaveLabel(request.leave_type)}</td></tr>
            <tr><td style="padding:8px 0;color:#718096;">From</td><td style="padding:8px 0;color:#202641;">${formatDate(request.start_date)}</td></tr>
            <tr><td style="padding:8px 0;color:#718096;">To</td><td style="padding:8px 0;color:#202641;">${formatDate(request.end_date)}</td></tr>
            <tr><td style="padding:8px 0;color:#718096;">Duration</td><td style="padding:8px 0;color:#202641;">${hoursToDisplay(request.hours)}</td></tr>
          </table>
          <a href="${APP_URL}/dashboard" style="display:inline-block;background:#202641;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            View dashboard →
          </a>
        </div>
      </div>
    `,
  })
}
