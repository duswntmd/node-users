const express = require('express'); // Express 모듈을 가져옵니다.
const mysql = require('mysql'); // MySQL 모듈을 가져옵니다.
const fs = require('fs'); // 파일 시스템 모듈을 가져옵니다.
const path = require('path'); // 경로 모듈을 가져옵니다.
const multer = require('multer'); // Multer 모듈을 가져옵니다.
var svrmain = require('./svr.js'); // svr.js 모듈을 가져옵니다.
var chat1 = require('./chat1.js'); // chat1.js 모듈을 가져옵니다.
const app = express(); // Express 애플리케이션을 생성합니다.

// MySQL 연결 설정
const db = mysql.createConnection({
  host: 'localhost', // MySQL 호스트
  user: 'root', // MySQL 사용자 이름
  password: '0000', // MySQL 비밀번호
  database: 'boardbase' // 사용할 데이터베이스 이름
});

// MySQL 연결
db.connect((error) => {
  if (error) {
    console.error('MySQL connection error:', error);
    return;
  }
  console.log('Connected to MySQL server');
});

// 미들웨어 설정
app.use(express.urlencoded({ extended: false })); // URL 인코딩을 처리하는 미들웨어를 설정합니다.
app.use(express.static('public')); // 정적 파일을 제공하는 미들웨어를 설정합니다.

// 이미지 업로드를 위한 Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 루트 경로 - 게시물 목록 조회 및 게시물 작성 폼
app.get('/', (req, res) => {
  // 게시물 목록 조회
  db.query('SELECT * FROM posts', (error, results) => {
    if (error) {
      console.error('MySQL query error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    const posts = results;
    let html = '<h1>성결 마켓</h1>';
    html += '<ul>';
    for (const post of posts) {
      html += `<li><a href="/post?id=${post.id}">${post.title}</a></li>`;
    }
    html += '</ul>';
    html += fs.readFileSync(path.join(__dirname, 'views', 'search.html'), 'utf-8');
    html += fs.readFileSync(path.join(__dirname, 'views', 'create.html'), 'utf-8');

    res.send(html);
  });
});

// 게시물 생성 폼
app.get('/create', (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'views', 'create.html'), 'utf-8');
  res.send(html);
});

// 게시물 생성
app.post('/create', upload.single('image'), (req, res) => {
  const { title, content, author } = req.body;
  const imageFile = req.file;

  if (!title || !content || !author || !imageFile) {
    res.status(400).send('Invalid request');
    return;
  }

  const post = {
    title,
    content,
    author,
    image_url: imageFile.filename
  };

  db.query('INSERT INTO posts SET ?', post, (error, result) => {
    if (error) {
      console.error('MySQL query error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log('New post created:', result.insertId);

    // 게시물 생성 후 리다이렉트
    res.redirect('/');
  });
});

// 게시물 검색
app.get('/search', (req, res) => {
  const query = req.query.query;

  db.query('SELECT * FROM posts WHERE title LIKE ?', [`%${query}%`], (error, results) => {
    if (error) {
      console.error('MySQL query error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    const posts = results;
    let html = '<h1>검색 결과</h1>';
    html += '<ul>';
    for (const post of posts) {
      html += `<li><a href="/post?id=${post.id}">${post.title}</a></li>`;
    }
    html += '</ul>';

    res.send(html);
  });
});

// 특정 게시물 조회
app.get('/post', (req, res) => {
  const postId = parseInt(req.query.id, 10);

  db.query('SELECT * FROM posts WHERE id = ?', [postId], (error, results) => {
    if (error) {
      console.error('MySQL query error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('Post not found');
      return;
    }

    const post = results[0];
    const html = fs.readFileSync(path.join(__dirname, 'views', 'post.html'), 'utf-8');
    res.send(html.replace(/<%= post.title %>/g, post.title)
      .replace(/<%= post.content %>/g, post.content)
      .replace(/<%= post.created_at %>/g, post.created_at)
      .replace(/<%= post.id %>/g, post.id)
      .replace(/<%= post.author %>/g, `<a href="http://localhost:3002">${post.author}</a>`)
      .replace(/<%= post.image_url %>/g, post.image_url));
  });
});

// 게시물 수정 폼
app.get('/edit', (req, res) => {
  const postId = parseInt(req.query.id, 10);

  db.query('SELECT * FROM posts WHERE id = ?', [postId], (error, results) => {
    if (error) {
      console.error('MySQL query error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('Post not found');
      return;
    }

    const post = results[0];
    const html = fs.readFileSync(path.join(__dirname, 'views', 'edit.html'), 'utf-8');
    res.send(html.replace(/<%= post.title %>/g, post.title)
      .replace(/<%= post.content %>/g, post.content)
      .replace(/<%= post.id %>/g, post.id)
      .replace(/<%= post.author %>/g, post.author)
      .replace(/<%= post.image_url %>/g, post.image_url));
  });
});

// 게시물 수정
app.post('/update', upload.single('image'), (req, res) => {
  const { id, title, content, author } = req.body;
  const imageFile = req.file;

  if (!id || !title || !content || !author) {
    res.status(400).send('Invalid request');
    return;
  }

  const post = {
    title,
    content,
    author
  };

  if (imageFile) {
    post.image_url = imageFile.filename;
  }

  db.query('UPDATE posts SET ? WHERE id = ?', [post, id], (error, result) => {
    if (error) {
      console.error('MySQL query error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log('Post updated:', id);

    // 게시물 수정 후 리다이렉트
    res.redirect(`/post?id=${id}`);
  });
});

// 게시물 삭제 폼
app.get('/delete', (req, res) => {
  const postId = parseInt(req.query.id, 10);

  db.query('SELECT * FROM posts WHERE id = ?', [postId], (error, results) => {
    if (error) {
      console.error('MySQL query error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('Post not found');
      return;
    }

    const post = results[0];
    const html = fs.readFileSync(path.join(__dirname, 'views', 'delete.html'), 'utf-8');
    res.send(html.replace(/<%= post.id %>/g, post.id));
  });
});

// 게시물 삭제
app.post('/delete', (req, res) => {
  const postId = parseInt(req.body.id, 10);

  db.query('DELETE FROM posts WHERE id = ?', [postId], (error, result) => {
    if (error) {
      console.error('MySQL query error:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log('Post deleted:', postId);

    // 게시물 삭제 후 리다이렉트
    res.redirect('/');
  });
});

// 서버 시작
app.listen(3001, () => {
  console.log('Server started on port 3001');
});
