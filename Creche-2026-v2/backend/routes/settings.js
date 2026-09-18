import { Router } from 'express';
import { getPool, sql } from '../db.js';

const router = Router();

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT TOP 1 * FROM settings');

    if (result.recordset.length === 0) {
      return res.json(null);
    }

    const row = result.recordset[0];
    res.json({
      name: row.name || '',
      rc: row.rc || '',
      nif: row.nif || '',
      article: row.article || '',
      agrement: row.agrement || '',
      address: row.address || '',
      tel: row.tel || '',
      city: row.city || ''
    });
  } catch (err) {
    console.error('GET /api/settings erreur:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings (upsert)
router.post('/', async (req, res) => {
  try {
    const s = req.body;
    const pool = await getPool();

    await pool.request()
      .input('name', sql.NVarChar, s.name || '')
      .input('rc', sql.NVarChar, s.rc || '')
      .input('nif', sql.NVarChar, s.nif || '')
      .input('article', sql.NVarChar, s.article || '')
      .input('agrement', sql.NVarChar, s.agrement || '')
      .input('address', sql.NVarChar, s.address || '')
      .input('tel', sql.NVarChar, s.tel || '')
      .input('city', sql.NVarChar, s.city || '')
      .query(`
        MERGE settings AS target
        USING (SELECT 1 AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN
          UPDATE SET name=@name, rc=@rc, nif=@nif, article=@article,
                     agrement=@agrement, address=@address, tel=@tel, city=@city
        WHEN NOT MATCHED THEN
          INSERT (id, name, rc, nif, article, agrement, address, tel, city)
          VALUES (1, @name, @rc, @nif, @article, @agrement, @address, @tel, @city);
      `);

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/settings erreur:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
