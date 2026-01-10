'use server';

import { sendEmail } from './utils';

/**
 * Server action to send a test email
 */
export async function sendTestEmailAction(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { default: TestEmail } = await import('./templates/test-email');

    return await sendEmail({
      to: email,
      subject: 'Test Email from EasyGST',
      template: TestEmail(),
    });
  } catch (error) {
    console.error('[Email] Failed to send test email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
