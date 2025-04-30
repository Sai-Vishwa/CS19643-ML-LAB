const express = require('express');
const cors = require('cors');
const { router } = require('./router/router');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// ❌ Do NOT use express.json() or express.urlencoded() for FormData-based routes

app.use(router);

app.listen(port, () => {
  console.log(`all basic requests are handled at http://localhost:${port}`);
});
