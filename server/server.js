const app = require('./app');
require('./config/db'); // Initialize DB

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Eduvora server running on http://localhost:${PORT}`);
});