import { Router } from 'express';
import { getPool, sql } from '../db.js';

const router = Router();

// GET /api/payments
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM payments');

    // Reconstituer le format PaymentHistory attendu par le frontend
    const history = {};
    result.recordset.forEach(row => {
      const childId = row.child_id;
      const year = row.year;
      const month = row.month;

      if (!history[childId]) history[childId] = {};
      if (!history[childId][year]) history[childId][year] = {};

      history[childId][year][month] = {
        childId,
        year,
        month,
        amountPaid: Number(row.amount_paid),
        paymentDate: row.payment_date
      };
    });

    res.json(history);
  } catch (err) {
    console.error('GET /api/payments erreur:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments (upsert)
router.post('/', async (req, res) => {
  try {
    const p = req.body;
    const pool = await getPool();

    await pool.request()
      .input('child_id', sql.NVarChar, p.childId)
      .input('year', sql.Int, p.year)
      .input('month', sql.Int, p.month)
      .input('amount_paid', sql.Decimal(10, 2), p.amountPaid)
      .input('payment_date', sql.NVarChar, p.paymentDate)
      .query(`
        MERGE payments AS target
        USING (SELECT @child_id AS child_id, @year AS year, @month AS month) AS source
          ON target.child_id = source.child_id AND target.year = source.year AND target.month = source.month
        WHEN MATCHED THEN
          UPDATE SET amount_paid=@amount_paid, payment_date=@payment_date
        WHEN NOT MATCHED THEN
          INSERT (child_id, year, month, amount_paid, payment_date)
          VALUES (@child_id, @year, @month, @amount_paid, @payment_date);
      `);

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/payments erreur:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/payments
router.delete('/', async (req, res) => {
  try {
    const { childId, year, month } = req.body;
    const pool = await getPool();

    await pool.request()
      .input('child_id', sql.NVarChar, childId)
      .input('year', sql.Int, year)
      .input('month', sql.Int, month)
      .query('DELETE FROM payments WHERE child_id=@child_id AND year=@year AND month=@month');

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/payments erreur:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
