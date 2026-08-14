require('dotenv').config();
const { getPool } = require('./src/config/db');

(async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT @@VERSION AS version');
    console.log('\n✅ Connection successful!\n');
    console.log(result.recordset[0].version);
  } catch (err) {
    console.error('\n❌ Connection failed:\n');
    console.error(err.message);
  } finally {
    process.exit(0);
  }
})();