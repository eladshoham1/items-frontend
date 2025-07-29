export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validatePersonalNumber = (personalNumber: number): boolean => {
  // Validation for personal number - must be exactly 7 digits
  const numberStr = personalNumber.toString();
  return numberStr.length === 7 && /^[0-9]{7}$/.test(numberStr);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};
