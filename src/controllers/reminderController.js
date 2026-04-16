const pool = require('../config/db');

// Listar todos los recordatorios
const getReminders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, 
        a.date AS appointment_date,
        a.service_type,
        p.name AS pet_name,
        o.name AS owner_name,
        o.phone AS owner_phone,
        o.email AS owner_email
      FROM reminders r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN pets p ON a.pet_id = p.id
      JOIN owners o ON p.owner_id = o.id
      ORDER BY r.reminder_date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener recordatorios' });
  }
};

// Recordatorios pendientes (no enviados)
const getPendingReminders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, 
        a.date AS appointment_date,
        a.service_type,
        p.name AS pet_name,
        o.name AS owner_name,
        o.phone AS owner_phone,
        o.email AS owner_email
      FROM reminders r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN pets p ON a.pet_id = p.id
      JOIN owners o ON p.owner_id = o.id
      WHERE r.sent = FALSE
      AND r.reminder_date <= NOW()
      ORDER BY r.reminder_date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener recordatorios pendientes' });
  }
};

// Crear recordatorio manual
const createReminder = async (req, res) => {
  const { appointment_id, reminder_date, channel } = req.body;

  if (!appointment_id || !reminder_date) {
    return res.status(400).json({ error: 'Cita y fecha son obligatorios' });
  }

  try {
    const apptExists = await pool.query(
      'SELECT id FROM appointments WHERE id = $1', [appointment_id]
    );
    if (apptExists.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const result = await pool.query(
      `INSERT INTO reminders (appointment_id, reminder_date, channel)
       VALUES ($1, $2, $3) RETURNING *`,
      [appointment_id, reminder_date, channel || 'email']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear recordatorio' });
  }
};

// Marcar recordatorio como enviado
const markReminderSent = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE reminders SET sent = TRUE WHERE id = $1 RETURNING *', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
    res.json({ message: 'Recordatorio marcado como enviado', reminder: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar recordatorio' });
  }
};

// Eliminar recordatorio
const deleteReminder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM reminders WHERE id = $1 RETURNING *', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
    res.json({ message: 'Recordatorio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar recordatorio' });
  }
};

module.exports = {
  getReminders,
  getPendingReminders,
  createReminder,
  markReminderSent,
  deleteReminder
};