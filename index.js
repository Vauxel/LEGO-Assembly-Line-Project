var logger = require("log-timestamp")(function() { return "[" + new Date().toLocaleString() + "] %s" });
var random = require("random-js")();

var express = require("express");
var app = express();
var expressWs = require("express-ws")(app);

var wsPoint;

var feetColors = [
	"beige",
	"black",
	"blue",
	"green",
	"red",
	"white"
];

var legsColors = [
	"blue",
	"green",
	"grey",
	"purple",
	"white",
	"yellow"
];

var torsoColors = [
	"black",
	"blue",
	"green",
	"grey",
	"orange",
	"purple",
	"red",
	"white",
	"yellow"
];

var armsColors = [
	"black",
	"blue",
	"brown",
	"grey",
	"orange",
	"pink",
	"purple",
	"white"
];

var faceColors = [
	"black",
	"blue",
	"brown",
	"grey",
	"red",
	"white",
	"yellow"
];

var eyeColors = [
	"black",
	"blue",
	"green",
	"grey",
	"red",
	"white",
	"yellow"
];

var hatColors = [
	"black",
	"blue",
	"green",
	"grey",
	"red",
	"yellow"
];

Array.prototype.randomElement = function() {
	return this[random.integer(0, this.length - 1)];
}

Number.prototype.padLeft = function(n) {
	return Array(n - String(this).length + 1).join('0') + this;
}

var assemblyActive = false;
var startTime = 0;

var currentOrder = {
	number: 0,
	feet: "",
	legs: "",
	torso: "",
	arms: "",
	face: "",
	eyes: "",
	hat: ""
};

var orderHistory = [];

function stopAssembly() {
	assemblyActive = false;

	wsPoint.clients.forEach(function(client) {
		client.send(JSON.stringify({
			command: "stop",
			stopTime: Date.now()
		}));
	});
}

function nextAssemblyItem() {
	newAssemblyItem(currentOrder.number + 1);
}

function resetAssembly() {
	assemblyActive = true;
	startTime = Date.now();

	newAssemblyItem(1);
}

function newAssemblyItem(number) {
	if(number == 1) {
		orderHistory = [];
	} else {
		orderHistory.push(currentOrder);
	}

	currentOrder = {
		number: number,
		feet: feetColors.randomElement(),
		legs: legsColors.randomElement(),
		torso: torsoColors.randomElement(),
		arms: armsColors.randomElement(),
		face: faceColors.randomElement(),
		eyes: eyeColors.randomElement(),
		hat: hatColors.randomElement()
	};

	broadcastState();
}

function broadcastState() {
	var timestamp = elapsedTime();

	wsPoint.clients.forEach(function(client) {
		client.send(JSON.stringify({
			command: "update",
			order: currentOrder,
			history: orderHistory,
			timestamp: timestamp
		}));
	});
}

function millisToTimestamp(millis) {
	var seconds = Math.floor((millis / 1000) % 60);
	var minutes = Math.floor((millis / (1000 * 60)) % 60);

	return minutes.padLeft(2) + ":" + seconds.padLeft(2);
}

function elapsedTime() {
	return millisToTimestamp(Date.now() - startTime);
}

app.get("/", function(req, res) {
	res.sendfile("index.html");
});

app.ws("/", function(ws, req) {
	if(assemblyActive) {
		var timestamp = elapsedTime();

		ws.send(JSON.stringify({
			command: "update",
			order: currentOrder,
			history: orderHistory,
			timestamp: timestamp
		}));
	} else {
		ws.send(JSON.stringify({
			command: "inactive",
		}));
	}

	ws.on("message", function(msg) {
		if(msg == "approve") {
			if(assemblyActive) {
				nextAssemblyItem();

				if(currentOrder.number > 50) {
					stopAssembly();
					console.log("Assembly order approved, no more assembly orders to complete");
					console.log("Assembly successfully finished 50 orders @ " + elapsedTime());
				} else {
					console.log("Assembly order approved, moving onto a new order");
				}
			}
		} else if(msg == "fail") {
			if(assemblyActive) {
				stopAssembly();
				console.log("Assembly order failed, stopping assembly");
				console.log("Assembly stopped on Order #" + currentOrder.number + " @ " + elapsedTime());
			}
		} else if(msg == "reset") {
			resetAssembly();
			console.log("Assembly reset");
		}
	});

	console.log("New client connected (" + wsPoint.clients.size + " clients now connected)");
});

wsPoint = expressWs.getWss();

app.get(/^(.+)$/, function(req, res){
	res.sendfile(__dirname + req.params[0]);
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
	console.log("LEGO Assembly Orders Interface app started on port " + port);
});

setInterval(function() {
	if(assemblyActive) {
		var timestamp = elapsedTime();

		wsPoint.clients.forEach(function(client) {
			client.send(JSON.stringify({
				command: "time",
				timestamp: timestamp,
			}));
		});
	}
}, 1000);