let socket = new WebSocket(window.location.origin.replace("http", "ws"));

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");

socket.onmessage = (event) => {
    let data = JSON.parse(event.data);

    if (data.type === "message") {
        addMessage("Desconocido: " + data.message);
    }

    if (data.type === "status") {
        addMessage("Sistema: " + data.message);
    }
};

send.onclick = () => {
    if (input.value.trim() !== "") {
        socket.send(input.value);
        addMessage("Tú: " + input.value);
        input.value = "";
    }
};

function addMessage(text) {
    let p = document.createElement("p");
    p.textContent = text;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
}
