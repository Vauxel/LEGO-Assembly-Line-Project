var ws = new WebSocket('ws://65.190.132.14:8080');

var colorMap = {
	"beige": "#D2B48C",
	"black": "#202020",
	"blue": "#3454B4",
	"green": "#239023",
	"red": "#D21919",
	"white": "#EFEFEF",
	"grey": "#939393",
	"yellow": "#F1E827",
	"purple": "#663096",
	"orange": "#FF5719",
	"pink": "#FF8396",
	"brown": "#96572A"
};

function approveOrder() {
	ws.send("approve");
}

function failOrder() {
	ws.send("fail");
}

function resetAssembly() {
	ws.send("reset");
}

ws.onmessage = function(event) {
	var data = JSON.parse(event.data);
	console.log(data);

	if(data.command == "update") {
		if(data.order.number <= 50) {
			$("#feetText").text(data.order.feet.toUpperCase());
			$("#feetColor").css("background-color", colorMap[data.order.feet]);
			$("#legsText").text(data.order.legs.toUpperCase());
			$("#legsColor").css("background-color", colorMap[data.order.legs]);
			$("#torsoText").text(data.order.torso.toUpperCase());
			$("#torsoColor").css("background-color", colorMap[data.order.torso]);
			$("#armsText").text(data.order.arms.toUpperCase());
			$("#armsColor").css("background-color", colorMap[data.order.arms]);
			$("#faceText").text(data.order.face.toUpperCase());
			$("#faceColor").css("background-color", colorMap[data.order.face]);
			$("#eyesText").text(data.order.eyes.toUpperCase());
			$("#eyesColor").css("background-color", colorMap[data.order.eyes]);
			$("#hatText").text(data.order.hat.toUpperCase());
			$("#hatColor").css("background-color", colorMap[data.order.hat]);

			$("#orderNumber").text("Current Order #" + data.order.number);
		}

		$("#ordersCompleted").text(data.order.number - 1);
		$("#ordersRemaining").text(Math.max(0, 50 - data.order.number));

		$("#timeCounter").text(data.timestamp);

		$("#orderHistory").empty();

		for(var i = 0; i < data.history.length; i++) {
			var element = data.history[i];

			$("#orderHistory").append(`<tr><th>${element.number}</th><td>${element.feet}</td><td>${element.legs}</td><td>${element.torso}</td><td>${element.arms}</td><td>${element.face}</td><td>${element.eyes}</td><td>${element.hat}</td></tr>`);
		}
	} else if(data.command == "time") {
		$("#timeCounter").text(data.timestamp);
	} else if(data.command == "stop") {
		$("#ordersCompletedFinal").text($("#ordersCompleted").text());
		$("#timeCounterFinal").text($("#timeCounter").text());
		$("#stopModal").addClass("is-active");
	} else if(data.command == "inactive") {
		$("#inactiveModal").addClass("is-active");
	}
};

$(document).ready(function() {
	$(".approveButton").click(function() {
		approveOrder();
	});

	$(".failButton").click(function() {
		failOrder();
	});

	$(".resetButton").click(function() {
		if($("#inactiveModal").hasClass("is-active")) {
			$("#inactiveModal").removeClass("is-active");
		}

		resetAssembly();
	});

	$(".closeInactiveModal").click(function() {
		$("#inactiveModal").removeClass("is-active");
	});

	$(".closeStopModal").click(function() {
		$("#stopModal").removeClass("is-active");
	});
});