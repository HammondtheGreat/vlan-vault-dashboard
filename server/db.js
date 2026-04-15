import mysql from "mysql2/promise";

async function createPool(retries = 15, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const p = mysql.createPool({
        host: process.env.DB_HOST || "db",
        port: parseInt(process.env.DB_PORT || "3306"),
        user: process.env.DB_USER || "ipam",
        password: process.env.DB_PASSWORD || "ipam_password",
        database: process.env.DB_NAME || "ipam",
        waitForConnections: true,
        connectionLimit: 10,
      });
      // Test connection
      const conn = await p.getConnection();
      conn.release();
      console.log("Database connected");
      return p;
    } catch (err) {
      console.log(`DB connection attempt ${i}/${retries} failed: ${err.message}`);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

const pool = await createPool();
export default pool;
