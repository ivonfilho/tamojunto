const { Client } = require('pg');
const fs = require('fs');

const client = new Client("postgresql://postgres:lbjFdixokkbjiMIibrbemdYKaaGOJoNp@kvm2.hostpress.com.br:666/railway?sslmode=disable");

(async () => {
  try {
    await client.connect();
    console.log("Conectado à Hostinger!");
    
    // Lê o seu arquivo de inserts
    const sql = fs.readFileSync('backup_railway.sql', 'utf8');
    
    console.log("Enviando os dados...");
    await client.query(sql);
    
    console.log("DADOS INSERIDOS COM SUCESSO NA HOSTINGER!");
  } catch (err) {
    console.error("ERRO:", err);
  } finally {
    await client.end();
  }
})();