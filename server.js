// Express Starter Template
const express = require('express');
const app = express();
const port = 8080;

// body-parser(callback 함수의 요청데이터(body) 해석을 도와준다)
app.use(express.urlencoded({extended: true}))

// MongoDB Connect
const MongoClient = require('mongodb').MongoClient;
let db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.v4iodsa.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true }, function(error, client){
  if (error) return console.log(error);

  // connect to [todoapp2 Database] 
  db = client.db('todoapp2');

  // App Port
  app.listen(port, () => {
    console.log(`**** TodoApp listening on port [${port}] ****`);
  });
});

// Home
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Write
app.get('/write', (req, res) => {
  res.sendFile(__dirname + '/write.html');
});

// write.html -> /add 요청
app.post('/add', (req, res) => {
  res.send('/add 전송완료');
  db.collection('post').insertOne({제목 : req.body.title, 날짜 : req.body.date}, (error, result) => {
    console.log('저장완료');
  });
});