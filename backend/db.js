const { Pool } = require("pg");

// Create a new pool instance with your connection URL
const pool = new Pool({
  connectionString: "postgres://postgres:postgres@localhost:5432/discord-bots",
});

// Export the pool object to use it in other files
module.exports = pool;
