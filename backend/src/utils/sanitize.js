/**
 * Utility function to sanitize user and santri objects before sending them as API responses.
 * This serves as a secondary defense layer (defense-in-depth) to prevent accidental credential leakage.
 */

function sanitizeSingleUser(user) {
  if (!user || typeof user !== 'object') return user;
  
  // Clone to avoid mutating original objects if they are cached/referenced elsewhere
  const clean = { ...user };
  
  // Remove sensitive fields
  delete clean.password;
  delete clean.password_hash;
  delete clean.resetToken;
  delete clean.otp;
  delete clean.verificationToken;
  delete clean.secret;
  
  return clean;
}

function sanitizeUserData(data) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeSingleUser(item));
  }
  
  return sanitizeSingleUser(data);
}

module.exports = {
  sanitizeUserData
};
