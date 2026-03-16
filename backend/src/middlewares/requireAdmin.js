// Bloqueia rotas de escrita para quem não for admin
module.exports = (req, res, next) => {
  try {
    if (req.user?.perfil === 'admin') return next();
    return res.status(403).json({ message: 'Permissão negada.' });
  } catch {
    return res.status(403).json({ message: 'Permissão negada.' });
  }
};