const admin = require('firebase-admin');

/**
 * Middleware to verify Firebase ID Tokens.
 * Expects header: Authorization: Bearer <token>
 */
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided. Please sign in.' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('❌ Token Verification Error:', error.message);
        return res.status(401).json({ error: 'Invalid or expired token. Please sign in again.' });
    }
};

module.exports = { verifyToken };
