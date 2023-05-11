const express = require('express');
const cors = require('cors');
const app = express();
 app.use(cors());

const routes = require('./routes');

app.use(express.json());
app.use('/',routes);

app.listen(3000,()=>{
  console.log("Server is running at Port : 3000")
})
