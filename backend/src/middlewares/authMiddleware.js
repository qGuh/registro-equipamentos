const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Token ausente.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload; // { id, perfil }
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido.' });
  }
};