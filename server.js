// Express Starter Template
const express = require('express');
const app = express();
const port = 8080;
// body-parser(callback 함수의 요청데이터(body) 해석을 도와준다)
app.use(express.urlencoded({extended: true}))
// MongoDB Connect
const MongoClient = require('mongodb').MongoClient;
// EJS
app.set('view engine', 'ejs');
// CSS
app.use('/public', express.static('public'));

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
  res.render('index.ejs');
});

// Write
app.get('/write', (req, res) => {
  res.render('write.ejs');
});

// write.html -> /add 요청
app.post('/add', (req, res) => {
  // 글번호 찾기
  db.collection('counter').findOne({name : '게시물갯수'}, (error, result) => {
    let totalPost = result.totalPost;
    // Insert
    db.collection('post').insertOne({ _id : totalPost + 1, 제목 : req.body.title, 날짜 : req.body.date }, (error, result) => {
      // counter 1++
      db.collection('counter').updateOne({name : '게시물갯수'},{ $inc : {totalPost : 1} }, (error, result) => {
        if(error){return console.log(error)};
      });
      res.send('/add 전송완료');
    });
  });
});

// List
app.get('/list', (req, res) => {
  db.collection('post').find().toArray((error, result) => {
    res.render('list.ejs', {listData : result});
  });
});

// Delete
app.delete('/delete', (req, res) => {
  db.collection('post').deleteOne({ _id : parseInt(req.body._id)}, (error, result) => {
    console.log('삭제완료');
    res.status(200).send({ message : '성공했습니다' });
  });
});

// Detail
app.get('/detail/:detailNum', (req, res) => {
  db.collection('post').findOne({_id : parseInt(req.params.detailNum)}, (error, result) => {
    console.log(result);
    res.render('detail.ejs', {detailData : result});
  });
});