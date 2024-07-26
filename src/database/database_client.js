import pkg from "pg";
const { Pool, Client } = pkg;

const USER = process.env["DB_USER"];
const DB_PORT = process.env["DB_PORT"];
const PASSWORD = `${process.env["DB_PASSWORD"]}`;
const HOST = process.env["HOST"];
const DB_NAME = process.env["DB_NAME"];

const poolConfigs = {
  host: HOST,
  user: USER,
  port: DB_PORT,
  password: PASSWORD,
  database: DB_NAME,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
};

const clientConfigs = {
  host: HOST,
  user: USER,
  port: DB_PORT,
  password: PASSWORD,
  database: DB_NAME,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
};

//@ts-ignore
const pool = new Pool(poolConfigs);
//@ts-ignore
const client = new Client(clientConfigs);

export { pool, client };
