import express from "express";
import "dotenv/config";
import router from "./routers/router.js";

const app = express();

app.use(express.json());
app.use(router);

const PORT = process.env["PORT"];

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}: http://localhost:${PORT}`);
});

export default app;
