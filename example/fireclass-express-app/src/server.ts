import express from "express";

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`fireclass-js example listening on http://localhost:${port}`);
});
