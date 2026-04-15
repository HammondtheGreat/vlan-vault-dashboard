import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "ipam",
  password: process.env.DB_PASSWORD || "ipam_password",
  database: process.env.DB_NAME || "ipam",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
