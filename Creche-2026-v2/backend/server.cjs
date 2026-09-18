const express = require('express');
const cors = require('cors');
const path = require('path');
const sql = require('mssql');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Config SQL Server
const dbConfig = {
  server: 'localhost',
  database: 'CrecheManager',
  port: 1433,
  user: 'creche_app',
  password: 'Creche2026!',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

let pool = null;
async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
    console.log('Connecte a SQL Server');
  }
  return pool;
}

// --- CHILDREN ---
app.get('/api/children', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT * FROM children ORDER BY nom ASC');
    const children = result.recordset.map(row => ({
      id: row.id, nom: row.nom, prenom: row.prenom,
      dateNaissance: row.date_naissance, dateInscription: row.date_inscription,
      sexe: row.sexe, section: row.section,
      nomPere: row.nom_pere, nomMere: row.nom_mere,
      numPere: row.num_pere, numMere: row.num_mere
    }));
    res.json(children);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/children', async (req, res) => {
  try {
    const c = req.body;
    const p = await getPool();
    await p.request()
      .input('id', sql.NVarChar, c.id)
      .input('nom', sql.NVarChar, c.nom)
      .input('prenom', sql.NVarChar, c.prenom)
      .input('date_naissance', sql.NVarChar, c.dateNaissance)
      .input('date_inscription', sql.NVarChar, c.dateInscription)
      .input('sexe', sql.NVarChar, c.sexe)
      .input('section', sql.NVarChar, c.section)
      .input('nom_pere', sql.NVarChar, c.nomPere || '')
      .input('nom_mere', sql.NVarChar, c.nomMere || '')
      .input('num_pere', sql.NVarChar, c.numPere || '')
      .input('num_mere', sql.NVarChar, c.numMere || '')
      .query(`MERGE children AS target USING (SELECT @id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET nom=@nom, prenom=@prenom, date_naissance=@date_naissance,
          date_inscription=@date_inscription, sexe=@sexe, section=@section,
          nom_pere=@nom_pere, nom_mere=@nom_mere, num_pere=@num_pere, num_mere=@num_mere
        WHEN NOT MATCHED THEN INSERT (id,nom,prenom,date_naissance,date_inscription,sexe,section,nom_pere,nom_mere,num_pere,num_mere)
          VALUES (@id,@nom,@prenom,@date_naissance,@date_inscription,@sexe,@section,@nom_pere,@nom_mere,@num_pere,@num_mere);`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/children/:id', async (req, res) => {
  try {
    const p = await getPool();
    await p.request().input('id', sql.NVarChar, req.params.id)
      .query('DELETE FROM children WHERE id = @id');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PAYMENTS ---
app.get('/api/payments', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT * FROM payments');
    const history = {};
    result.recordset.forEach(row => {
      if (!history[row.child_id]) history[row.child_id] = {};
      if (!history[row.child_id][row.year]) history[row.child_id][row.year] = {};
      history[row.child_id][row.year][row.month] = {
        childId: row.child_id, year: row.year, month: row.month,
        amountPaid: Number(row.amount_paid), paymentDate: row.payment_date
      };
    });
    res.json(history);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payments', async (req, res) => {
  try {
    const pm = req.body;
    const p = await getPool();
    await p.request()
      .input('child_id', sql.NVarChar, pm.childId)
      .input('year', sql.Int, pm.year)
      .input('month', sql.Int, pm.month)
      .input('amount_paid', sql.Decimal(10,2), pm.amountPaid)
      .input('payment_date', sql.NVarChar, pm.paymentDate)
      .query(`MERGE payments AS target
        USING (SELECT @child_id AS child_id, @year AS year, @month AS month) AS source
          ON target.child_id=source.child_id AND target.year=source.year AND target.month=source.month
        WHEN MATCHED THEN UPDATE SET amount_paid=@amount_paid, payment_date=@payment_date
        WHEN NOT MATCHED THEN INSERT (child_id,year,month,amount_paid,payment_date)
          VALUES (@child_id,@year,@month,@amount_paid,@payment_date);`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/payments', async (req, res) => {
  try {
    const { childId, year, month } = req.body;
    const p = await getPool();
    await p.request()
      .input('child_id', sql.NVarChar, childId)
      .input('year', sql.Int, year)
      .input('month', sql.Int, month)
      .query('DELETE FROM payments WHERE child_id=@child_id AND year=@year AND month=@month');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT TOP 1 * FROM settings');
    if (result.recordset.length === 0) return res.json(null);
    const row = result.recordset[0];
    res.json({ name: row.name||'', rc: row.rc||'', nif: row.nif||'', monthlyFee: Number(row.monthly_fee) || 10000||'', article: row.article||'',
      agrement: row.agrement||'', address: row.address||'', tel: row.tel||'', city: row.city||'' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', async (req, res) => {
  try {
    const s = req.body;
    const p = await getPool();
    await p.request()
      .input('name', sql.NVarChar, s.name||'')
      .input('rc', sql.NVarChar, s.rc||'')
      .input('nif', sql.NVarChar, s.nif||'')
      .input('article', sql.NVarChar, s.article||'')
      .input('agrement', sql.NVarChar, s.agrement||'')
      .input('address', sql.NVarChar, s.address||'')
      .input('tel', sql.NVarChar, s.tel||'')
      .input('city', sql.NVarChar, s.city||'')
      .input('monthly_fee', sql.Decimal(10,2), s.monthlyFee || 10000)
      .query(`MERGE settings AS target USING (SELECT 1 AS id) AS source ON target.id=source.id
        WHEN MATCHED THEN UPDATE SET name=@name, rc=@rc, nif=@nif, article=@article,
          agrement=@agrement, address=@address, tel=@tel, city=@city, monthly_fee=@monthly_fee
        WHEN NOT MATCHED THEN INSERT (id,name,rc,nif,article,agrement,address,tel,city,monthly_fee)
          VALUES (1,@name,@rc,@nif,@article,@agrement,@address,@tel,@city,@monthly_fee);`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- HEALTH ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- FRONTEND ---
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'dist', 'index.html')));

app.listen(PORT, () => console.log('CrecheManager demarre sur port ' + PORT));