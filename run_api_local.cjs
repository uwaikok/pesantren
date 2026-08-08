const app = require('./api/index.js');
const port = 5001;

app.listen(port, () => {
  console.log(`Local Vercel API test server running on http://localhost:${port}`);
});
