const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies.token; // Get from cookie
  console.log('Token from cookie:', token ? 'Present': 'Missing');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
   // console.log('Decoded token :', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Invalid token error:', err.message);
    return res.status(401).json({error: 'Invalid token'});
  }
};