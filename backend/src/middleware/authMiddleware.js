/**
 * authMiddleware.js
 * Express middleware that verifies a Firebase ID token sent in the
 * Authorization header (Bearer <token>).
 *
 * Usage in routes:
 *   import { protect } from '../middleware/authMiddleware.js';
 *   router.use(protect);          // require auth on all routes
 *   router.get('/private', protect, handler);
 */
import { adminAuth } from '../config/firebaseAdmin.js';

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches the decoded token payload to req.firebaseUser on success.
 */
export async function protect(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized – no token provided.',
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized – no token provided.',
    });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.firebaseUser = decoded; // { uid, email, name, picture, ... }
    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized – invalid or expired token.',
    });
  }
}
