const Util = {
    makeId: function (length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}

var Channel = function (msgCallBackFn, openCallBackFn, closeCallBackFn) {

    var channel = this;
    channel.socket = new WebSocket('ws://localhost:8080');
    channel.msgCallBackFn = msgCallBackFn;
    channel.openCallBackFn = openCallBackFn;
    channel.closeCallBackFn = closeCallBackFn;

    channel.socket.addEventListener("message", function (event) {
        channel.msgCallBackFn(channel, event);
    });

    channel.socket.addEventListener('open', function (event) {
        channel.openCallBackFn(channel, event);
    });

    channel.socket.addEventListener('close', function (event) {
        channel.closeCallBackFn(channel, event);
    });
}

const App = function () {
    var app = this;

    app.areas = document.getElementsByClassName("area");
    app.channel = new Channel(function (channel, event) {
            console.log("received a message");
            var data = JSON.parse(event.data);

            // ok, so the data can have a structure... probably a command
            if (data.command == "add") {
                var newCard = document.createElement("div");
                newCard.classList.add("card");
                newCard.setAttribute("id", data.id)
                newCard.innerHTML =
                    `<div class="message">${data.msg}</div><i class="fas fa-times-circle delete"></i>`;

                var whichBox = document.getElementById(data.type);
                whichBox.appendChild(newCard);

                whichBox.querySelectorAll(".delete").forEach(
                    (delIcon) => {
                        delIcon.addEventListener("click", function (event) {
                            var allDeletes = event.target;
                            var pDel = allDeletes.parentNode.getAttribute("id");
                            console.log(pDel);
                            event.stopPropagation(); // stop the click from registering on the background box
                            if (confirm("are you sure you want to delete this for all users?")) {
                                channel.socket.send(JSON.stringify({
                                    command: "delete",
                                    id: pDel
                                }));
                                console.log("clicked the delete box id: " + pDel);
                                event.stopPropagation();
                            }

                        })
                    }
                )
            }

            if (data.command == "delete") {
                document.querySelector('#' + data.id).remove();
            }
        },
        function (event) {
            console.log("opened connection")
        },
        function (event) {
            console.log("closed the connection")
        });

    app.init = function () {
        for (var i = 0; i < app.areas.length; i++) {
            new Area(app.channel, app.areas[i]);
        }
    }
    app.init();
}

const Area = function (channel, element) {
    var area = this;
    area.element = element;
    area.channel = channel;

    area.element.addEventListener("click", function () {
        var type = area.element.getAttribute("id");
        var msg = prompt("what would you like to say...");
        if (msg) {
            var data = {
                command: "add",
                type: type,
                msg: msg,
                id: Util.makeId(10)
            };
            channel.socket.send(JSON.stringify(data));
        }
    })

    area.init = function () {

    }
}


new App();