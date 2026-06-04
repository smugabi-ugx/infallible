/**
 * Role-Based Access Control middleware.
 * Must be used AFTER authenticateToken (which sets req.userRole).
 *
 * Usage:
 *   router.get('/admin-only', authenticateToken, requireRole('admin'), handler)
 *   router.get('/police-or-admin', authenticateToken, requireRole('police', 'admin'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' })
  }
  if (!roles.includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      error: `Forbidden — requires role: ${roles.join(' or ')}`,
    })
  }
  next()
}

module.exports = { requireRole }
