import bcrypt from 'bcryptjs';

/**
 * Generates a random secure temporary password (e.g. "A7kP9mQ2").
 * Meets requirements: sufficient length, uppercase + lowercase + numbers, non-hardcoded.
 */
export function generateTempPassword(length: number = 8): string {
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz';
  const numberChars = '23456789';
  const allChars = uppercaseChars + lowercaseChars + numberChars;

  let password = '';
  // Ensure at least one upper, one lower, one digit
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));

  for (let i = 3; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle chars
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

/**
 * Generates a unique, standardized username.
 * Format:
 *   Student: hs_0001, hs_0002, ...
 *   Parent:  ph_0001, ph_0002, ...
 * Ensures uniqueness against existing usernames list (lowercase, no spaces).
 */
export function generateUniqueUsername(
  isStudent: boolean,
  targetId: string,
  existingUsernames: string[] = []
): string {
  const prefix = isStudent ? 'hs_' : 'ph_';
  const lowerExisting = existingUsernames.map(u => u.toLowerCase().trim());

  // Attempt 1: Derive numeric index from targetId (e.g., STU-2026-001 -> 001)
  const numericMatch = targetId.match(/\d+/g);
  let baseNum = 1;
  if (numericMatch && numericMatch.length > 0) {
    const lastPart = numericMatch[numericMatch.length - 1];
    baseNum = parseInt(lastPart, 10) || 1;
  }

  let candidate = `${prefix}${String(baseNum).padStart(4, '0')}`;
  let counter = baseNum;

  while (lowerExisting.includes(candidate)) {
    counter++;
    candidate = `${prefix}${String(counter).padStart(4, '0')}`;
  }

  return candidate.toLowerCase();
}

/**
 * Hashes a plaintext password securely using bcrypt.
 */
export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export function verifyPassword(plainText: string, hash: string): boolean {
  if (!plainText || !hash) return false;
  try {
    return bcrypt.compareSync(plainText, hash);
  } catch (err) {
    console.warn('bcrypt compare failed:', err);
    return false;
  }
}

/**
 * Validates new password during First Login password change.
 */
export function validateNewPassword(
  newPassword: string,
  confirmPassword: string,
  currentTempPassword?: string
): { isValid: boolean; error?: string } {
  if (!newPassword || newPassword.length < 6) {
    return { isValid: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
  }
  if (newPassword !== confirmPassword) {
    return { isValid: false, error: 'Mật khẩu mới và xác nhận mật khẩu không khớp nhau.' };
  }
  if (currentTempPassword && newPassword === currentTempPassword) {
    return { isValid: false, error: 'Mật khẩu mới không được trùng với mật khẩu tạm thời.' };
  }
  return { isValid: true };
}
