const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTRO
const register = async (req, res) => {
  const { name, email, password, role, commission_rate } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

  try {
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, commission_rate) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [name, email, hashedPassword, role || 'groomer', commission_rate || 0]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// OBTENER PERFIL PROPIO
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, commission_rate, photo_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// ACTUALIZAR PERFIL PROPIO
const updateProfile = async (req, res) => {
  const { name, email, password, photo_url } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nombre y email son obligatorios' });
  }
  try {
    let query, params;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET name=$1, email=$2, password=$3, photo_url=$4 WHERE id=$5 RETURNING id, name, email, role, commission_rate, photo_url, created_at';
      params = [name, email, hashed, photo_url, req.user.id];
    } else {
      query = 'UPDATE users SET name=$1, email=$2, photo_url=$3 WHERE id=$4 RETURNING id, name, email, role, commission_rate, photo_url, created_at';
      params = [name, email, photo_url, req.user.id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// REGISTRAR GROOMER (solo admin)
const registerGroomer = async (req, res) => {
  const { name, email, password, commission_rate } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, commission_rate) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, commission_rate',
      [name, email, hashed, 'groomer', commission_rate || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar groomer' });
  }
};

// LISTAR GROOMERS — fix para que aparezcan en el select de citas
const getGroomers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, commission_rate FROM users WHERE role = 'groomer' ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener groomers' });
  }
};

module.exports = { register, login, getProfile, updateProfile, registerGroomer, getGroomers };