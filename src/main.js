import express from "express";
import "dotenv/config";
import router from "./routers/router.js";

const app = express();

const defaultTokenExpiration = "3h";

app.use(express.json());
app.use(router);

const PORT = process.env["PORT"];
const HOST = process.env["HOST"];

const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}: http://${HOST}:${PORT}`);
});

export default app;

export { defaultTokenExpiration, server };
