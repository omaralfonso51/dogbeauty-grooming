// Validar contraseña segura
const validatePassword = (password) => {
  if (!password) return null;
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe tener al menos una mayúscula';
  if (!/[0-9]/.test(password)) return 'La contraseña debe tener al menos un número';
  return null;
};

// Validar email
const validateEmail = (email) => {
  if (!email) return null;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return 'El email no tiene un formato válido';
  return null;
};

// Validar teléfono colombiano
const validatePhone = (phone) => {
  if (!phone) return null;
  const clean = phone.replace(/\s/g, '');
  if (!/^[0-9+]{7,15}$/.test(clean)) return 'El teléfono no es válido';
  return null;
};

// Validar precio
const validatePrice = (price) => {
  const p = parseFloat(price);
  if (isNaN(p) || p <= 0) return 'El precio debe ser un número mayor a 0';
  return null;
};

// Validar stock
const validateStock = (stock) => {
  const s = parseInt(stock);
  if (isNaN(s) || s < 0) return 'El stock no puede ser negativo';
  return null;
};

module.exports = { validatePassword, validateEmail, validatePhone, validatePrice, validateStock };