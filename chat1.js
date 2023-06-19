const express = require("express"); // Express 모듈을 불러옵니다.
const http = require("http"); // HTTP 모듈을 불러옵니다.
const app = express(); // Express 애플리케이션을 생성합니다.
const path = require("path"); // 경로 관련 기능을 제공하는 모듈을 불러옵니다.
const server = http.createServer(app); // Express 애플리케이션을 기반으로 HTTP 서버를 생성합니다.
const socketIO = require("socket.io"); // Socket.IO 모듈을 불러옵니다.
const moment = require("moment"); // 날짜 및 시간 관련 기능을 제공하는 모듈을 불러옵니다.
var board = require('./board.js'); // board 모듈을 불러옵니다.
var svrmain = require('./svr.js'); // svrmain 모듈을 불러옵니다.

const io = socketIO(server); // 서버와 Socket.IO를 연결합니다.

app.use(express.static(path.join(__dirname, "src"))); // 정적 파일을 제공하기 위해 express.static 미들웨어를 사용합니다.

const PORT = process.env.PORT || 3002; // 포트 번호를 설정합니다. 환경 변수에 PORT가 지정되어 있으면 그 값을 사용하고, 그렇지 않으면 기본값으로 3002를 사용합니다.

io.on("connection", (socket) => {
  // 클라이언트와의 연결이 성공하면 실행됩니다.
  socket.on("chatting", (data) => {
    // 클라이언트에서 'chatting' 이벤트를 수신하면 실행됩니다.
    const { name, msg } = data;
    io.emit("chatting", {
      name,
      msg,
      time: moment(new Date()).format("h:ss A"), // 현재 시간을 'h:ss A' 형식으로 포맷하여 전송합니다.
    });
  });
});

server.listen(PORT, () => console.log(`server is running ${PORT}`)); // 서버를 지정된 포트에서 실행합니다.
