import mysql from "mysql2/promise";

// Prevent multiple instances during Next.js hot reloads
const globalForPool = globalThis;

const isBuild = process.env.NEXT_IS_BUILD === "true";

if (!globalForPool.mysqlPool) {
  globalForPool.mysqlPool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    // Connection pool settings
    connectionLimit: isBuild ? 1 : 10, // Max simultaneous connections
    waitForConnections: true, // Queue requests when pool is full
    queueLimit: 0, // Unlimited queue size
    maxIdle: 10, // Max idle connections to keep
    idleTimeout: 60000, // Close idle connections after 60s
    enableKeepAlive: true, // Keep connections alive
    keepAliveInitialDelay: 0, // Start keep-alive immediately
  });
}

const pool = globalForPool.mysqlPool;

export default pool;
