
import express from 'express';
const app = express();
const port = process.env.PORT || 10000;

app.use(express.static('.'));

app.listen(port, ()=> console.log("Web server running on port", port));
