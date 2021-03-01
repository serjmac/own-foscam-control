const mysql = require("mysql2/promise");
db = "foscam";

module.exports = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    console.log("checkInitDB connection.threadId: " + connection.threadId);
    const createDB = "CREATE DATABASE IF NOT EXISTS foscam";
    let [rows, fields] = await connection.execute(createDB);
    //console.log("DB creation: ", rows);
    if (rows.warningStatus === 1) {
      console.log("database 'foscam' already present, skipping creation");
    } else if (rows.warningStatus === 0) {
      console.log("database 'foscam' not present, created");
    }
    await connection.changeUser({ database: db });
    const createTableActivations =
      "CREATE TABLE IF NOT EXISTS activations ( switch CHAR(3), created_at TIMESTAMP DEFAULT NOW(), user_ip VARCHAR(15), user_agent VARCHAR(255))";
    [rows, fields] = await connection.execute(createTableActivations);
    //console.log("table activations: ", rows);
    if (rows.warningStatus === 1) {
      console.log("table 'activations' already present, skipping creation");
    } else if (rows.warningStatus === 0) {
      console.log("table 'activations' not present, created");
    }
    const createTableFtps = "CREATE TABLE IF NOT EXISTS ftps (file_path VARCHAR(255) UNIQUE, file_time TIMESTAMP, file_type CHAR(3))";
    [rows, fields] = await connection.execute(createTableFtps);
    //console.log("table ftps: ", rows);
    if (rows.warningStatus === 1) {
      console.log("table 'ftps' already present, skipping creation");
    } else if (rows.warningStatus === 0) {
      console.log("table 'ftps' not present, created");
    }
  } catch (error) {
    console.error(error);
    if (error.code === "ECONNREFUSED") {
      console.log("Database not reachable, please check URL, port and credentials");
    }
  }
};
