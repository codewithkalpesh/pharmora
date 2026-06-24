const db = require('../utils/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/authUtils');

const register = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    const [user] = await db('users').insert({
      username,
      email,
      password: hashedPassword,
      role
    }).returning('*');

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db('users').where({ username }).first();
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = {
  register,
  login
};

