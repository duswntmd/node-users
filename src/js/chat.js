"use strict";

const socket = io(); // Socket.IO 클라이언트 객체를 생성합니다.

const nickname = document.querySelector("#nickname"); // 닉네임 입력 필드를 선택합니다.
const chatlist = document.querySelector(".chatting-list"); // 채팅 메시지 목록을 선택합니다.
const chatInput = document.querySelector(".chatting-input"); // 채팅 입력 필드를 선택합니다.
const sendButton = document.querySelector(".send-button"); // 전송 버튼을 선택합니다.
const displaycontainer = document.querySelector(".display-container"); // 메시지 스크롤 컨테이너를 선택합니다.

chatInput.addEventListener("keypress", (event) => {
  // 채팅 입력 필드에서 키가 눌려질 때 이벤트를 처리합니다.
  if (event.keyCode === 13) {
    // 엔터 키(키 코드 13)가 눌렸을 때
    send(); // 메시지를 전송합니다.
    chatInput.value = " "; // 채팅 입력 필드를 초기화합니다.
  }
});

function send() {
  // 메시지를 전송하는 함수입니다.
  const param = {
    name: nickname.value, // 닉네임을 가져옵니다.
    msg: chatInput.value, // 메시지 내용을 가져옵니다.
  };
  socket.emit("chatting", param); // 서버로 'chatting' 이벤트와 전송할 데이터를 전달합니다.
}

sendButton.addEventListener("click", send); // 전송 버튼을 클릭할 때 send 함수를 호출합니다.

socket.on("chatting", (data) => {
  // 서버에서 'chatting' 이벤트를 수신하면 실행됩니다.
  const { name, msg, time } = data;
  const item = new LiModel(name, msg, time); // 채팅 메시지 항목 객체를 생성합니다.
  item.makeLi(); // 채팅 메시지를 목록에 추가합니다.
  displaycontainer.scrollTo(0, displaycontainer.scrollHeight); // 메시지 스크롤을 가장 아래로 이동합니다.
});

function LiModel(name, msg, time) {
  // 채팅 메시지 항목 객체 생성자 함수입니다.
  this.name = name; // 이름
  this.msg = msg; // 메시지 내용
  this.time = time; // 시간

  this.makeLi = () => {
    // 채팅 메시지 항목을 생성하는 메서드입니다.
    const li = document.createElement("li"); // li 요소를 생성합니다.
    li.classList.add(nickname.value === this.name ? "sent" : "received"); // 닉네임에 따라 송신 혹은 수신 메시지로 구분하는 클래스를 추가합니다.
    const dom = `<span class="profile">
        <span class="user">${this.name}</span>
        <img class="image" src="http://placeimg.com/50/50/any" alt="any">
    </span>
    <span class="message">${this.msg}</span>
    <span class="time">${this.time}</span>`; // 메시지 항목의 HTML 구조를 작성합니다.
    li.innerHTML = dom; // li 요소의 내용으로 HTML 구조를 설정합니다.
    chatlist.appendChild(li); // 채팅 메시지 목록에 li 요소를 추가합니다.
  };
}
