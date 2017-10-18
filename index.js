var logger = require("log-timestamp")(function() { return "[" + new Date().toLocaleString() + "] %s" });
var random = require("random-js")();

var express = require("express");
var app = express();
var expressWs = require("express-ws")(app);

var wsPoint;

var orderLimit = 50;

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
var lastOrderNumber = 0;

var assemblyOrders = {};
var assuranceOrders = {};
var completedOrders = [];

function requestNewOrder() {
	lastOrderNumber++;
	newAssemblyItem(lastOrderNumber);
	broadcastAssemblyOrders();
	broadcastInfo();
}

function assemblyFinishOrder(number) {
	if(!(number in assemblyOrders)) {
		return;
	}

	assuranceOrders[number] = assemblyOrders[number];
	assemblyOrders[number] = undefined;
	delete assemblyOrders[number];

	broadcastInfo();
	broadcastAssemblyOrders();
	broadcastAssuranceOrders();
}

function assuranceApproveOrder(number) {
	if(!(number in assuranceOrders)) {
		return;
	}

	completedOrders.push(assuranceOrders[number]);
	assuranceOrders[number] = undefined;
	delete assuranceOrders[number];

	broadcastInfo();
	broadcastAssuranceOrders();
	broadcastCompletedOrders();
}

function stopAssembly() {
	assemblyActive = false;

	wsPoint.clients.forEach(function(client) {
		client.send(JSON.stringify({
			command: "stop",
			completed: completedOrders.length,
			timestamp: elapsedTime()
		}));
	});

	console.log("Assembly stopped on Order #" + lastOrderNumber + " @ " + elapsedTime());
}

function resetAssembly() {
	assemblyOrders = {};
	assuranceOrders = {};
	completedOrders = [];

	assemblyActive = true;
	startTime = Date.now();
	lastOrderNumber = 1;

	newAssemblyItem(lastOrderNumber);

	broadcastInfo();
	broadcastOrders();
}

function newAssemblyItem(number) {
	assemblyOrders[number] = {
		number: number.padLeft(2),
		feet: feetColors.randomElement(),
		legs: legsColors.randomElement(),
		torso: torsoColors.randomElement(),
		arms: armsColors.randomElement(),
		face: faceColors.randomElement(),
		eyes: eyeColors.randomElement(),
		hat: hatColors.randomElement()
	};
}

function broadcastInfo() {
	var timestamp = elapsedTime();
	var requestsLength = Object.keys(assemblyOrders).length;
	var approvalsLength = Object.keys(assuranceOrders).length;

	wsPoint.clients.forEach(function(client) {
		client.send(JSON.stringify({
			command: "info",
			completed: completedOrders.length,
			requests: requestsLength,
			approvals: approvalsLength,
			timestamp: timestamp
		}));
	});
}

function broadcastOrders() {
	wsPoint.clients.forEach(function(client) {
		client.send(JSON.stringify({
			command: "orders",
			assembly: assemblyOrders,
			assurance: assuranceOrders,
			completed: completedOrders
		}));
	});
}

function broadcastAssemblyOrders() {
	wsPoint.clients.forEach(function(client) {
		client.send(JSON.stringify({
			command: "orders_assembly",
			orders: assemblyOrders
		}));
	});
}

function broadcastAssuranceOrders() {
	wsPoint.clients.forEach(function(client) {
		client.send(JSON.stringify({
			command: "orders_assurance",
			orders: assuranceOrders
		}));
	});
}

function broadcastCompletedOrders() {
	wsPoint.clients.forEach(function(client) {
		client.send(JSON.stringify({
			command: "orders_completed",
			orders: completedOrders
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
	res.sendFile(__dirname + "/index.html");
});

app.ws("/", function(ws, req) {
	if(assemblyActive) {
		ws.send(JSON.stringify({
			command: "orders",
			assembly: assemblyOrders,
			assurance: assuranceOrders,
			completed: completedOrders
		}));

		ws.send(JSON.stringify({
			command: "info",
			completed: completedOrders.length,
			requests: Object.keys(assemblyOrders).length,
			approvals: Object.keys(assuranceOrders).length,
			timestamp: elapsedTime()
		}));
	} else {
		ws.send(JSON.stringify({
			command: "inactive",
		}));
	}

	ws.on("message", function(msg) {
		var parsed = msg.split(' ');

		if(parsed[0] == "request") {
			if(assemblyActive) {
				if(lastOrderNumber < orderLimit) {
					requestNewOrder();
					console.log("New assembly order requested (#" + lastOrderNumber + ")");
				}
			}
		} else if(parsed[0] == "finish") {
			if(assemblyActive) {
				assemblyFinishOrder(parsed[1]);
				console.log("Assembly order #" + parsed[1] + " finished being built");
			}
		} else if(parsed[0] == "approve") {
			if(assemblyActive) {
				assuranceApproveOrder(parsed[1]);
				console.log("Assembly order #" + parsed[1] + " approved and completed");

				if(completedOrders.length >= orderLimit) {
					stopAssembly();
					console.log("Assembly successfully completed " + completedOrders.length + " orders in " + elapsedTime());
				}
			}
		} else if(parsed[0] == "fail") {
			if(assemblyActive) {
				stopAssembly();
				console.log("Assembly order failed, stopping assembly");
				console.log("Assembly stopped on Order #" + lastOrderNumber + " @ " + elapsedTime());
			}
		} else if(parsed[0] == "reset") {
			resetAssembly();
			console.log("The assembly has been reset");
		}
	});

	console.log("New client connected (" + wsPoint.clients.size + " clients now connected)");
});

wsPoint = expressWs.getWss();

app.get(/^(.+)$/, function(req, res){
	res.sendFile(__dirname + req.params[0]);
});

app.listen(8080, function() {
	console.log("LEGO Assembly Orders Interface app started on port 8080");
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