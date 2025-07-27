export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validatePersonalNumber = (personalNumber: number): boolean => {
  // Basic validation for personal number (adjust as needed)
  const numberStr = personalNumber.toString();
  return numberStr.length >= 6 && numberStr.length <= 15;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};
