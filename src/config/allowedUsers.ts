// Allowed email addresses for authentication
// Reads from environment variables for better security

// Read allowed emails from environment variable
// Format: "email1@domain.com,email2@domain.com,email3@domain.com"
const getAllowedEmailsFromEnv = (): string[] => {
  const envEmails = process.env.ALLOWED_EMAILS || 'eladshoham1@gmail.com,momogelis@gmail.com';
  console.log('🔍 Checking ALLOWED_EMAILS environment variable:', envEmails);
  if (!envEmails) {
    console.warn('⚠️ ALLOWED_EMAILS not found in environment variables');
    console.warn('📝 Please add ALLOWED_EMAILS to your .env file');
    return [];
  }
  
  // Split by comma and clean up
  const emails = envEmails
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
    
  console.log('✅ Loaded allowed emails from environment:', emails.length, 'emails');
  return emails;
};

export const ALLOWED_EMAILS = getAllowedEmailsFromEnv();

// Function to check if an email is allowed
export const isEmailAllowed = (email: string | null): boolean => {
  if (!email) {
    console.warn('❌ No email provided for authorization check');
    return false;
  }
  
  if (ALLOWED_EMAILS.length === 0) {
    console.error('❌ No allowed emails configured! Check your .env file.');
    return false;
  }
  
  // Convert to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim();
  
  const isAllowed = ALLOWED_EMAILS.some(allowedEmail => 
    allowedEmail.toLowerCase().trim() === normalizedEmail
  );
  
  if (isAllowed) {
    console.log('✅ Email authorized:', normalizedEmail);
  } else {
    console.warn('❌ Email not authorized:', normalizedEmail);
    console.log('📋 Allowed emails:', ALLOWED_EMAILS);
  }
  
  return isAllowed;
};

// Main function to check if user is authorized
export const isUserAuthorized = (email: string | null): boolean => {
  // Check specific emails first
  return isEmailAllowed(email);
};
