import bcrypt from 'bcrypt';

/**
 * Bcrypt Salt Rounds Configuration
 * Standardized to 10 rounds for optimal security and CPU efficiency in Node.js.
 */
export const BCRYPT_SALT_ROUNDS = 10;

/**
 * Hash a plain text password with 10 salt rounds.
 * @param {string} password - Raw user password
 * @param {number} rounds - Bcrypt cost factor (defaults to 10)
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password, rounds = BCRYPT_SALT_ROUNDS) {
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password against a stored bcrypt hash.
 * @param {string} candidatePassword - Password provided at login
 * @param {string} hashedPassword - Stored hash from MongoDB
 * @returns {Promise<boolean>}
 */
export async function comparePassword(candidatePassword, hashedPassword) {
  return bcrypt.compare(candidatePassword, hashedPassword);
}
