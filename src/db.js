const {Pool} = require('pg');

const pool = new Pool({
    user : 'ici_db_user',
    host : 'localhost',
    database : 'lms_db_main',
    password : 'DB123_ICI',
    port : 5432
});

module.exports = pool;