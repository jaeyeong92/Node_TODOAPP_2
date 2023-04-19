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
// method-override
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
// Session
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());
// Socket.io
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);


let db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.v4iodsa.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true }, function(error, client){
  if (error) return console.log(error);

  // connect to [todoapp2 Database] 
  db = client.db('todoapp2');

  // App Port
  http.listen(port, () => {
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
    db.collection('post').insertOne({ _id : totalPost + 1, 제목 : req.body.title, 날짜 : req.body.date, 작성자 : req.user._id }, (error, result) => {
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
  db.collection('post').deleteOne({ _id : parseInt(req.body._id), 작성자 : req.user._id}, (error, result) => {
    console.log('삭제완료');
    res.status(200).send({ message : '성공했습니다' });
  });
});

// Detail
app.get('/detail/:detailNum', (req, res) => {
  db.collection('post').findOne({_id : parseInt(req.params.detailNum)}, (error, result) => {
    res.render('detail.ejs', {detailData : result});
  });
});

// Edit
app.get('/edit/:editNum', (req, res) => {
  db.collection('post').findOne({ _id : parseInt(req.params.editNum) }, (error, result) => {
    res.render('edit.ejs', { editData : result});
  });
});

// edit.ejs -> /edit put 요청  form action="/edit?_method=PUT"
app.put('/edit', (req, res) => {
  db.collection('post').updateOne({ _id : parseInt(req.body.id) },{ $set : {제목 : req.body.title, 날짜 : req.body.date} }, (error, result) => {
    res.redirect('/list');
  });
});

// Login 
app.get('/login', (req, res) => {
  res.render('login.ejs');
});

// Login -> /login post 요청 , ** passport set start **
app.post('/login', passport.authenticate('local',{
  failureRedirect : '/fail'
}), (req, res) => {
  res.redirect('/');    // go to home
});

// ID,Password 인증 코드
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (error, result) {
    if (error) return done(error)

    if (!result) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == result.pw) {
      return done(null, result)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

// Session을 저장시키는 코드 (로그인 성공 시 발동) -> 파라미터 user에 위에서의 인증 후 result가 들어감
passport.serializeUser(function(user, done){
  done(null, user.id); // 세션 데이터를 만들고 세션의 id 정보를 쿠키로 보냄
});

// 로그인 한 유저의 개인정보를 DB에서 찾는 역할 (마이페이지 접속 시 발동), Param의 아이디는 위에서의 user.id
passport.deserializeUser(function(아이디, done){
  db.collection('login').findOne({ id : 아이디 }, function(error ,result){
    done(null, result);
  });
});

// ** passport set end **




// My Page
app.get('/mypage', hasLogin, (req, res) => {
  res.render('mypage.ejs', { mypageData : req.user });
});

// Login 여부 체크
function hasLogin(req, res, next){
  if(req.user){
    next();
  } else {
    res.send('로그인부터 해주세요');
  }
}

// Search - URL query string
app.get('/search', (req, res) => {
  let searchRule = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    },
    { $sort : { _id : 1 } },
    // { $limit : 5 }
  ]; 
  db.collection('post').aggregate(searchRule).toArray((error, result) => {
    res.render('search.ejs', { searchData : result });
  });
});

// SIGN UP
app.post('/register', (req, res) => {
  db.collection('login').insertOne({ id : req.body.id, pw : req.body.pw }, (error, result) => {
    res.redirect('/');
  });
})

// Socket.io - ChatRoom
app.get('/socket', (req, res) => {
  res.render('socket.ejs');
});

// 유저가 WebSocket 접속 시, 서버가 뭔가 실행하고 싶으면 -> socket.ejs에서 let socket = io();
io.on('connection', (socket) => {

  // 유저가 socket.emit()으로 데이터를 전송했을 때, 서버에서 받으려면
  socket.on('user-send', function(userData){
    io.emit('broadcast', userData);
    // 1명에게
    // io.to(socket.id).emit('broadcast', userData);
  });

  // 채팅방 생성
  socket.on('joinroom', function(userData){
    socket.join('room1');
  });

  socket.on('room1-send', function(userData){
    io.to('room1').emit('broadcast', userData);
  });
});








