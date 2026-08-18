const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: "postgresql://postgres:lbjFdixokkbjiMIibrbemdYKaaGOJoNp@centerbeam.proxy.rlwy.net:59625/railway",
  ssl: { rejectUnauthorized: false }
});

async function exportData() {
  try {
    await client.connect();
    console.log("Conectado ao Railway com sucesso!");

    // Buscar todas as tabelas públicas do banco
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    const resTables = await client.query(tablesQuery);
    const tables = resTables.rows.map(r => r.table_name);

    let sqlDump = `-- Backup gerado via Node.js em ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      console.log(`Exportando tabela: ${table}...`);
      const dataRes = await client.query(`SELECT * FROM "${table}"`);
      
      if (dataRes.rows.length === 0) continue;

      const columns = Object.keys(dataRes.rows[0]);
      
      for (const row of dataRes.rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'object') return `'${JSON.stringify(val)}'`;
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          return val;
        });

        sqlDump += `INSERT INTO "${table}" ("${columns.join('", "')}") VALUES (${values.join(', ')});\n`;
      }
      sqlDump += '\n';
    }

    fs.writeFileSync('backup_railway.sql', sqlDump);
    console.log("\nBackup gerado com sucesso no arquivo: backup_railway.sql!");
  } catch (err) {
    console.error("Erro ao exportar:", err);
  } finally {
    await client.end();
  }
}

exportData();