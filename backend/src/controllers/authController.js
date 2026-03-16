const pool = require('../config/database'); // mysql2/promise
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  try {
    const { login, senha } = req.body;
    if (!login || !senha) {
      return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Configuração JWT ausente.' });
    }

    const [rows] = await pool.query(
      `SELECT id, nome, login, tipo_perfil, senha_hash
         FROM usuarios_sistema
        WHERE login = ?
        LIMIT 1`,
      [login]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const user = rows[0];

    const ok = user.senha_hash ? await bcrypt.compare(senha, user.senha_hash) : false;
    if (!ok) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // >>> Payload agora inclui login e nome (essenciais p/ logs)
    const payload = {
      id: user.id,
      login: user.login,
      nome: user.nome,
      perfil: user.tipo_perfil
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    return res.json({
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        login: user.login,
        email: user.login,       // mantido para compatibilidade
        perfil: user.tipo_perfil,
      },
    });
  } catch (err) {
    console.error('Erro no login (DB):', err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nome, login AS email, login, tipo_perfil
         FROM usuarios_sistema
        WHERE id = ?
        LIMIT 1`,
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const u = rows[0];
    return res.json({
      id: u.id,
      nome: u.nome,
      email: u.email,
      login: u.login,
      perfil: u.tipo_perfil,
    });
  } catch (err) {
    console.error('Erro no /auth/me:', err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};