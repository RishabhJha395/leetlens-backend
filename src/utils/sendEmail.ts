import { Resend } from 'resend';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is missing from environment variables');
  }

  const resend = new Resend(resendApiKey);

  // If the user has not verified a custom domain on Resend, they MUST send from onboarding@resend.dev
  // Note: onboarding@resend.dev can ONLY send to the email address registered with the Resend account.
  // Once a custom domain is verified, this can be changed to something like 'noreply@yourdomain.com'
  const { data, error } = await resend.emails.send({
    from: 'LeetLens Team <onboarding@resend.dev>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  });

  if (error) {
    console.error('Resend API Error:', error);
    throw new Error(error.message);
  }
};
