const pool = require('../config/db');

// Listar todas las citas
const getAppointments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
        p.name AS pet_name, p.breed,
        o.name AS owner_name,
        u.name AS groomer_name,
        c.name AS cut_name
      FROM appointments a
      JOIN pets p ON a.pet_id = p.id
      JOIN owners o ON p.owner_id = o.id
      LEFT JOIN users u ON a.groomer_id = u.id
      LEFT JOIN cuts c ON a.cut_id = c.id
      ORDER BY a.date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
};

// Obtener cita por ID
const getAppointmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.*, 
        p.name AS pet_name, p.breed,
        o.name AS owner_name,
        u.name AS groomer_name,
        c.name AS cut_name
      FROM appointments a
      JOIN pets p ON a.pet_id = p.id
      JOIN owners o ON p.owner_id = o.id
      LEFT JOIN users u ON a.groomer_id = u.id
      LEFT JOIN cuts c ON a.cut_id = c.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cita' });
  }
};

// Crear cita
const createAppointment = async (req, res) => {
  const { pet_id, groomer_id, service_type, cut_id, date, price, notes } = req.body;

  if (!pet_id || !groomer_id || !service_type || !date || !price) {
    return res.status(400).json({ error: 'Mascota, groomer, servicio, fecha y precio son obligatorios' });
  }

  try {
    // Validar que no haya conflicto de horario para el groomer
    const conflict = await pool.query(`
      SELECT id FROM appointments
      WHERE groomer_id = $1
      AND status != 'cancelled'
      AND date BETWEEN $2::timestamp - INTERVAL '1 hour'
      AND $2::timestamp + INTERVAL '1 hour'
    `, [groomer_id, date]);

    if (conflict.rows.length > 0) {
      return res.status(400).json({ error: 'El groomer ya tiene una cita en ese horario' });
    }

    const result = await pool.query(`
      INSERT INTO appointments (pet_id, groomer_id, service_type, cut_id, date, price, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [pet_id, groomer_id, service_type, cut_id, date, price, notes]);

    // Crear recordatorio automático 24 horas antes
    await pool.query(`
      INSERT INTO reminders (appointment_id, reminder_date)
      VALUES ($1, $2::timestamp - INTERVAL '24 hours')
    `, [result.rows[0].id, date]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cita' });
  }
};

// Actualizar cita
const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { service_type, cut_id, date, price, notes } = req.body;

  try {
    const result = await pool.query(`
      UPDATE appointments 
      SET service_type=$1, cut_id=$2, date=$3, price=$4, notes=$5
      WHERE id=$6 RETURNING *
    `, [service_type, cut_id, date, price, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
};

// Completar cita y calcular comisión
const completeAppointment = async (req, res) => {
  const { id } = req.params;

  try {
    const appt = await pool.query(`
      SELECT a.*, u.commission_rate 
      FROM appointments a
      JOIN users u ON a.groomer_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (appt.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const { price, groomer_id, commission_rate, status } = appt.rows[0];

    if (status === 'completed') {
      return res.status(400).json({ error: 'La cita ya fue completada' });
    }

    // Actualizar estado
    await pool.query(
      'UPDATE appointments SET status=$1 WHERE id=$2',
      ['completed', id]
    );

    // Calcular y guardar comisión
    const commission = (price * commission_rate) / 100;
    await pool.query(
      'INSERT INTO commissions (groomer_id, appointment_id, amount) VALUES ($1, $2, $3)',
      [groomer_id, id, commission]
    );

    res.json({
      message: 'Cita completada',
      commission_generated: commission
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al completar cita' });
  }
};

// Cancelar cita
const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *',
      ['cancelled', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    res.json({ message: 'Cita cancelada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar cita' });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  completeAppointment,
  cancelAppointment
};