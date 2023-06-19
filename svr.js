const express = require('express'); // Express 웹 프레임워크
const mysql = require('mysql'); // MySQL 데이터베이스
const path = require('path'); // 경로 관련 유틸리티
const static = require('serve-static'); // 정적 파일 서비스 모듈
const dbconfig = require('./config/dbconfig.json'); // 데이터베이스 구성 파일
var board = require('./board.js'); // 게시판 모듈
var chat1 = require('./chat1.js'); // 채팅 모듈
// MySQL 데이터베이스 연결 풀을 생성합니다.
const pool = mysql.createPool({
    connectionLimit: 10,
    host: dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password,
    port: dbconfig.port,
    database: dbconfig.database,
    debug: false
})
// Express 애플리케이션 생성
const app = express()
// 미들웨어 설정
app.use(express.urlencoded({extended:true})) // URL 인코딩된 데이터 처리
app.use(express.json()) // JSON 데이터 처리
app.use('/public', static(path.join(__dirname, 'public'))); // 정적 파일 서비스

// 홈 페이지 라우팅
app.get('/', (req, res) => {
     // login.html 파일과 adduser.html 파일을 클라이언트에 전송합니다.
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
    res.sendFile(path.join(__dirname, 'public', 'adduser.html'));
  });
// 로그인 처리 라우팅
app.post('/process/login', (req, res)=>{
    console.log('/process/login 호출됨' +req)
    const paramId = req.body.id;
    const paramPassword = req.body.password;
    console.log('로그인 요청'+paramId+''+paramPassword);
    // 데이터베이스 연결 풀에서 커넥션을 가져옵니다.
    pool.getConnection((err, conn)=>{
        if(err){
            conn.release();
            console.log('Mysql getConnection error. aborted');
            res.writeHead('200', {'content-type':'text/html; charset=utf8'})
            res.write('<h1>DB서버 연결 실패</h1>')
            res.end();
            return;
        }
        // 사용자 인증을 위해 데이터베이스에서 쿼리를 실행합니다.
        const exec = conn.query('select `id`, `name` from `users` where `id`=? and `password`= md5(?)',
               [paramId, paramPassword],
               (err, rows)=>{
                conn.release();
                console.log('실행된 SQL query:' +exec.sql);

                if(err){
                    console.dir(err)
                    res.writeHead('200', {'content-type':'text/html; charset=utf8'})
                    res.write('<h1>SQL query 실행 실패</h1>')
                    res.end();
                    return;
                }
                if(rows.length > 0){
                    console.log('아이디[%s], 패스워드가 일치하는 사용자 [%s] 찾음', paramId, rows[0].name)
                    res.writeHead('302', { 'Location': 'http://localhost:3001' });
                    res.end();
                    return;
                }
                else{
                    console.log('아이디[%s], 패스워드가 일치하는게 없음 ', paramId)
                    res.writeHead('200', {'content-type':'text/html; charset=utf8'})
                    res.write('<h2>로그인 실패. 아이디와 패스워드를 확인하세요.</h2>')
                    res.end();
                    return;
                }
               }
        )
    })
});
// 사용자 삭제 처리 라우팅
app.post('/process/deleteuser', (req, res) => {
    console.log('/process/deleteuser 호출됨', req);
    const paramId = req.body.id;
    const paramPassword = req.body.password;
    console.log('회원 삭제 요청', paramId, paramPassword);
    // 데이터베이스 연결 풀에서 커넥션을 가져옵니다.
    pool.getConnection((err, conn) => {
        if (err) {
            conn.release();
            console.log('Mysql getConnection error. aborted');
            res.writeHead('200', {'content-type':'text/html; charset=utf8'});
            res.write('<h1>DB서버 연결 실패</h1>');
            res.end();
            return;
        }
        // 사용자 인증을 위해 데이터베이스에서 쿼리를 실행합니다.
        const exec = conn.query('SELECT id, name FROM users WHERE id = ? AND password = md5(?)',
            [paramId, paramPassword],
            (err, rows) => {
                conn.release();
                console.log('실행된 SQL query:', exec.sql);

                if (err) {
                    console.dir(err);
                    res.writeHead('200', {'content-type':'text/html; charset=utf8'});
                    res.write('<h1>SQL query 실행 실패</h1>');
                    res.end();
                    return;
                }

                if (rows.length > 0) {
                    console.log('아이디[%s], 패스워드가 일치하는 사용자 [%s] 찾음', paramId, rows[0].name);

                    pool.getConnection((err, conn) => {
                        if (err) {
                            conn.release();
                            console.log('Mysql getConnection error. aborted');
                            res.writeHead('200', {'content-type':'text/html; charset=utf8'});
                            res.write('<h1>DB서버 연결 실패</h1>');
                            res.end();
                            return;
                        }

                        const deleteExec = conn.query('DELETE FROM users WHERE id = ?',
                            [paramId],
                            (err, result) => {
                                conn.release();
                                console.log('실행된 SQL query:', deleteExec.sql);

                                if (err) {
                                    console.dir(err);
                                    res.writeHead('200', {'content-type':'text/html; charset=utf8'});
                                    res.write('<h1>SQL query 실행 실패</h1>');
                                    res.end();
                                    return;
                                }

                                if (result.affectedRows > 0) {
                                    console.log('아이디[%s] 사용자 삭제 성공', paramId);
                                    res.writeHead('200', {'content-type':'text/html; charset=utf8'});
                                    res.write('<h2>사용자 삭제 성공</h2>');
                                    res.end();
                                } else {
                                    console.log('아이디[%s] 사용자 삭제 실패', paramId);
                                    res.writeHead('200', {'content-type':'text/html; charset=utf8'});
                                    res.write('<h2>사용자 삭제 실패</h2>');
                                    res.end();
                                }
                            }
                        );
                    });
                } else {
                    console.log('아이디[%s], 패스워드가 일치하는게 없음', paramId);
                    res.writeHead('200', {'content-type':'text/html; charset=utf8'});
                    res.write('<h2>로그인 실패. 아이디와 패스워드를 확인하세요.</h2>');
                    res.end();
                    return;
                }
            }
        );
    });
});
// 회원가입 처리 라우팅
app.post('/process/adduser', (req, res)=>{
    
    console.log('/process/adduser 호출됨' +req)
    const paramId = req.body.id;
    const paramName = req.body.name;
    const paramAge = req.body.age;
    const paramPassword = req.body.password;
    // 데이터베이스 연결 풀에서 커넥션을 가져옵니다.
    pool.getConnection((err, conn)=>{
        
        if(err){
            conn.release();
            console.log('Mysql getConnection error. aborted');
            res.writeHead('200', {'content-type':'text/html; charset=utf8'})
            res.write('<h1>DB서버 연결 실패</h1>')
            res.end();
            return;
        }
        console.log('데이터베이스 연결 끈 얻었음...ㅎㅎ');
        // 사용자 생성을 위해 데이터베이스에서 쿼리를 실행합니다.
        const exec = conn.query('insert into users (id, name, age, password) values (?,?,?,md5(?));',
                   [paramId, paramName, paramAge, paramPassword],
                   (err, result)=>{
                    conn.release();
                    console.log('실행된 SQL: ' +exec.sql)
                    if(err){
                        console.log('SQL 실행시 오류 발생')
                        console.dir(err);
                        res.writeHead('200', {'content-type':'text/html; charset=utf8'})
                        res.write('<h1>SQL query 실행 실패</h1>')
                        res.end();
                        return
                    }
                    if(result){
                        console.dir(result)
                        console.log('Inserted 성공')

                        res.writeHead('200', {'content-type':'text/html; charset=utf8'})
                        res.write('<h2>사용자 추가 성공</h2>')
                        res.end();
                    }
                    else{
                        console.log('Inserted 실패')

                        res.writeHead('200', {'content-type':'text/html; charset=utf8'})
                        res.write('<h1>사용자 추가 실패</h1>')
                        res.end();
                    }
                   }
        )
        
    })
});
// 3000번 포트에서 서버를 시작합니다.
app.listen(3000,()=>{
    console.log('Listening on port 3000')
})