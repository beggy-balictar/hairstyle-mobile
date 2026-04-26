const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const upperRegex = /[A-Z]/;
const lowerRegex = /[a-z]/;
const numberRegex = /\d/;
const specialRegex = /[^A-Za-z0-9]/;

export const validateEmail = (value: string) => {
  if (!value.trim()) return 'Email is required.';
  if (!emailRegex.test(value.trim())) return 'Enter a valid email address.';
  return '';
};

export const validateFullName = (value: string) => {
  if (!value.trim()) return 'Full name is required.';
  if (value.trim().length < 3) return 'Full name must be at least 3 characters.';
  return '';
};

/** Strip non-digits and format as YYYY-MM-DD while typing (year first, then month, then day). */
export const formatBirthDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const strictYmdRegex = /^(\d{4})-(\d{2})-(\d{2})$/;

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/**
 * Birth date must be exactly YYYY-MM-DD: 4-digit year, 2-digit month (01–12), 2-digit day.
 * Parsed in that order so month and day cannot be swapped without failing validation.
 */
export const validateBirthDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 'Birth date is required.';
  const match = trimmed.match(strictYmdRegex);
  if (!match) {
    return 'Use YYYY-MM-DD: year (4 digits), month (01–12), day (01–31). Example: 1999-03-07.';
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const now = new Date();
  const currentYear = now.getFullYear();
  if (year < 1900 || year > currentYear) {
    return `Year must be the first 4 digits, between 1900 and ${currentYear}.`;
  }
  if (month < 1 || month > 12) {
    return 'Month is the middle segment and must be 01–12 (not the day).';
  }
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    return `Day is the last segment and must be 01–${String(maxDay).padStart(2, '0')} for that month.`;
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return 'That calendar date is not valid.';
  }
  if (date > now) return 'Birth date cannot be in the future.';
  return '';
};

export const validatePassword = (value: string) => {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!upperRegex.test(value)) return 'Password must include an uppercase letter.';
  if (!lowerRegex.test(value)) return 'Password must include a lowercase letter.';
  if (!numberRegex.test(value)) return 'Password must include a number.';
  if (!specialRegex.test(value)) return 'Password must include a special character.';
  return '';
};

export const validateConfirmPassword = (password: string, confirmPassword: string) => {
  if (!confirmPassword) return 'Please confirm your password.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return '';
};
