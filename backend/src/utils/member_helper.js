/**
 * Member Helper Utilities
 * Standardizes membership and expiration logic across the system
 */

/**
 * Get effective membership info based on expiration date
 * @param {Object} member - Member object containing membership_expires, tier_code, etc.
 * @returns {Object} - { is_expired, tier_code, plan_name, max_books }
 */
function getEffectiveMembership(member) {
  const now = new Date();
  const expiry = member.membership_expires ? new Date(member.membership_expires) : null;
  
  // If expired (only if it has an expiry date)
  if (expiry && expiry < now) {
    return {
      is_expired: true,
      tier_code: 'basic',
      plan_name: 'Hết hạn (Basic)',
      max_books: 3 // Default for basic
    };
  }

  // Not expired or no expiry date (unlimited/permanent)
  return {
    is_expired: false,
    tier_code: member.tier_code || 'basic',
    plan_name: member.plan_name || 'Basic',
    max_books: member.max_books_borrowed || 3
  };
}

module.exports = {
  getEffectiveMembership
};
