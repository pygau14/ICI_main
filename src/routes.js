const express = require('express');
const router = express.Router();
// jwt token for auth
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const pool = require('./db');
const bodyParser = require('body-parser');


const storage = multer.memoryStorage();
const upload = multer({storage : storage});

//sign up route
router.post('/signup',upload.single('profile_picture'), async(req,res)=>{
  const {name, email , password , mobile_no, dob , country , state , city , street_address , school_name, institute_name , courses , subjects } = req.body;
  const profile_picture = req.file ? req.file.buffer : null ;


  // if (password !== confirmPassword){
  //   return res.status(400).json({message : 'Password do not match'});
  // }

  const hashedPassword  = await bcrypt.hash(password,10);

  try {
    const client  = await pool.connect();

    try {
      await client.query('BEGIN');

      const userResult  = await client.query('INSERT INTO users (name, email , password) VALUES ($1,$2,$3) RETURNING userid',[name, email , hashedPassword]);
      const userID = userResult.rows[0].userid;

      const format = require('pg-format');
      const coursesArr = format('{%L}', courses);
      const subjectsArr = format('{%L}',subjects);

      await client.query('INSERT INTO user_details (name , mobile_no , dob, country , state , city , street_address , school_name, college_name, subjects, courses , image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',[name, mobile_no, dob ,country , state , city , street_address , school_name, institute_name , coursesArr , subjectsArr, profile_picture]);

      await client.query('COMMIT');


      return res.status(200).json({message : 'User Created Sucessfully'});

    }
    catch(e){
      await client.query('ROLLBACK');
      throw e;
    } finally{
      client.release();
    }
  }
  catch(e){
    console.error(e);
    return res.status(500).json({message : 'Internal server error'});
  }
});


router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());


router.post('/login',upload.none(),async(req,res)=>{
  const {email , password} = req.body;
  console.log('data received from front end ');
  

  try {
      const results = null;
    try{
      await pool.query('SELECT * FROM users WHERE email = ?', [email],async (error,result)=>{
        if(error){
          console.log('ERROR')
          console.log(error);

        }
        else{
          if(result.length > 0){
            const passwordMatch = await bcrypt.compare(password, result[0].password);
            if(!passwordMatch){
              console.log('password is wrong');
              return res.status(401).json({message : 'Invalid email and password'});
            }
            else{
              const token = jwt.sign({userID : result[0].id},'secret',{ expiresIn: '1h' });
              res.cookie('token', token, { httpOnly: true });
              res.status(200).json({message : 'Login Sucessful'});
            }
          }
          else{
            console.log('email is wrong');
            return res.status(401).json({message:'Invalid email and password'});
          }
        }
        
        
      });

    }catch (e) {
      console.log('internal catch error');
      console.error(e);
      res.status(500).json({ message: 'Internal server error' });
    }
  }catch (e) {
    console.log('outer catch erro');
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/subjects/:class',upload.none(),async (req,res)=>{
  const selectedClass = req.params.class;
  const client = await pool.connect();

  client.query('SELECT subjects_list FROM classes_sub WHERE class=$1',[selectedClass],(error,results)=>{
    if(error){
      console.error(error);
      res.status(500).json({message :'Internal Server Error'});
    }
    else {
      const subjectsArr = results.rows[0].subjects_list;
      const subjects_list = subjectsArr.map(subject=>subject.trim());
      res.status(200).json(subjects_list);
      client.release();
    }
  });

});


router.get('/chapters/:class/:subject_name',async (req,res)=>{
  const selectedClass = req.params.class;
  const subject_name = req.params.subject_name;
  const client = await pool.connect();

  client.query('SELECT chapters_list FROM class_sub_chapter WHERE class = $1 AND subject_name = $2',[selectedClass,subject_name],(error,results)=>{
    if(error){
      console.error(error);
      res.status(400).json({message : 'Internal Server Error'});
    }
    else{
      const chaptersArr = results.rows[0].chapters_list;
      const chapters_list = chaptersArr.map(chapter=>chapter.trim());
      res.status(200).json(chapters_list);
    }
  });
});

router.get('/topics/:class/:chapter_name',async(req,res)=>{
  console.log('running 3rd gate');
  const selectedClass = req.params.class;
  const chapter_name = req.params.chapter_name;
  const client = await pool.connect();

  client.query('SELECT topics_list FROM class_chap_topic WHERE class = $1 AND chapter_name = $2',[selectedClass,chapter_name],(error,results)=>{
    if(error){
      console.error(error);
      res.status(400).json({message : 'Internal server error'});
    }
    else{
      const topicsArr = results.rows[0].topics_list;
      const topics_list = topicsArr.map(topic=>topic.trim())
      console.log(topics_list);
      res.status(200).json(topics_list);
    }
  })
})


router.get('/api/courses',async (req,res)=>{
  try{
    const client = await pool.connect();
    // Query the popular_courses table for courses with ratings 4 and 5
    const query = 'SELECT class, subject_name, chapter_name, topic_name, course_url, rating FROM popular_course WHERE rating IN (\'4\', \'5\')';
    const { rows } = await client.query(query);

    // orgainzing the data
    const courses = rows.map(row=>{
      return {
        class : row.class,
        subject_name : row.subject_name,
        chapter_name : row.chapter_name,
        topic_name : row.topic_name,
        course_url : row.course_url,
        rating : row.rating
      }
    });
    res.status(200).json(courses);

  }catch(error){
    console.error('Error fetching course',error);
    res.status(500).json({message : 'Error fetching course'})
  }
})


module.exports =router; 
