const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { fullName, email, password, role, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Naam, email aur password zaroori hain' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password kam az kam 6 characters ka ho' });
    }
    if (role && !['customer', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Role sirf customer ya owner ho sakta hai' });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Is email pe account pehle se mojood hai' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      fullName,
      email,
      passwordHash,
      role: role || 'customer',
      phone,
    });

    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email aur password zaroori hain' });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email ya password ghalat hai' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Email ya password ghalat hai' });
    }

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token: signToken(user) });
  } catch (err) {
    next(err);
  }
}
async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User nahi mila' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
module.exports = { register, login, me };