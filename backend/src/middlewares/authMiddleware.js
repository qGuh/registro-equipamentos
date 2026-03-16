const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Token ausente.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

    // payload esperado: { id, login, nome, perfil }
    req.user = {
      id: payload.id,
      login: payload.login || null,
      nome: payload.nome || null,
      perfil: payload.perfil || payload.role || null,
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido.' });
  }
};