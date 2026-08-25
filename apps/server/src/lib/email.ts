import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

const from = process.env.EMAIL_FROM || 'HeatTrack <onboarding@resend.dev>'

const resend = apiKey ? new Resend(apiKey) : null

if (!resend) {
    console.warn(
        '[email] RESEND_API_KEY is not set — verification links will be logged to the console instead of sent.'
    )
}

const verificationTemplate = (name: string, url: string) => `
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Confirm your email</h1>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
      Hey ${name || 'there'} — confirm your email address to finish setting up your HeatTrack account.
    </p>
    <a href="${url}"
       style="display: inline-block; background: #22c55e; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 15px; font-weight: 600;">
      Verify email
    </a>
    <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 0;">
      This link expires in an hour. If you didn't create a HeatTrack account, you can ignore this email.
    </p>
  </div>
`

type VerificationArgs = {
    user: { email: string; name?: string | null }
    url: string
}

// Sends the account verification email. Never throws: a mail outage should not take down sign-up.
//  Failures are logged loudly, and the user can retry from /api/auth/send-verification-email.

export const sendVerificationEmail = async ({ user, url }: VerificationArgs) => {
    if (!resend) {
        console.warn(`[email] verification link for ${user.email}:\n${url}`)
        return
    }

    try {
        const { error } = await resend.emails.send({
            from,
            to: user.email,
            subject: 'Confirm your email — HeatTrack',
            html: verificationTemplate(user.name ?? '', url),
        })

        if (error) {
            console.error(`[email] failed to send verification to ${user.email}:`, error)
        }
    } catch (error) {
        console.error(`[email] failed to send verification to ${user.email}:`, error)
    }
}
