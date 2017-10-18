var ws = new WebSocket('ws://65.190.132.14:8080');

function chooseAssemblyDepartment() {
	if($("#selectionModal").hasClass("is-active")) {
		$("#selectionModal").removeClass("is-active");
	}

	$("#assuranceView").css("display", "none");
	$("#assemblyView").css("display", "inherit");
}

function chooseAssuranceDepartment() {
	if($("#selectionModal").hasClass("is-active")) {
		$("#selectionModal").removeClass("is-active");
	}

	$("#assemblyView").css("display", "none");
	$("#assuranceView").css("display", "inherit");
}

function closeStopModal() {
	$("#stopModal").removeClass("is-active");
}

function resetAssembly() {
	ws.send("reset");
}

function requestNewOrder() {
	ws.send("request");
}

function finishOrder(number) {
	ws.send("finish " + number);
}

function approveOrder(number) {
	ws.send("approve " + number);
}

function failOrder(number) {
	ws.send("fail " + number);
}

function resetAssembly() {
	ws.send("reset");
}

function addOrders(orders, destination) {
	$(destination).empty();

	if(destination == "#completedOrders") {
		for(var i = 0; i < orders.length; i++) {
			var order = orders[i];

			$(destination).append(`<tr><th>${order.number}</th><td>${order.feet}</td><td>${order.legs}</td><td>${order.torso}</td><td>${order.arms}</td><td>${order.face}</td><td>${order.eyes}</td><td>${order.hat}</td></tr>`);
		}
	} else if(destination == "#assemblyOrders" || destination == "#assuranceOrders") {
		for(var number in orders) {
			if(!(number in orders)) {
				continue;
			}

			var order = orders[number];
			var controls;

			if(destination == "#assemblyOrders") {
				controls = `<a href="javascript:finishOrder(${number});" class="button is-success">Finish</a>`;
			} else if(destination == "#assuranceOrders") {
				controls = `<a href="javascript:approveOrder(${number});" class="button is-success">Approve</a>
				<a href="javascript:failOrder(${number});" class="button is-danger">Fail</a>`;
			}

			$(destination).prepend(`<div class="order">
				<div class="order-header">
					<div class="order-number"># ${number}</div>
					<div class="order-controls">
						${controls}
					</div>
				</div>
				<div class="columns">
					<div class="order-part column">
						<div class="part-name">Feet</div>
						<figure class="image is-128x128 part-image">
							<img src="assets/feet.png">
						</figure>
						<div class="part-color part-color-${order.feet}">${order.feet}</div>
					</div>
					<div class="order-part column">
						<div class="part-name">Legs</div>
						<figure class="image is-128x128 part-image">
							<img src="assets/legs.png">
						</figure>
						<div class="part-color part-color-${order.legs}">${order.legs}</div>
					</div>
					<div class="order-part column">
						<div class="part-name">Torso</div>
						<figure class="image is-128x128 part-image">
							<img src="assets/torso.png">
						</figure>
						<div class="part-color part-color-${order.torso}">${order.torso}</div>
					</div>
					<div class="order-part column">
						<div class="part-name">Arms</div>
						<figure class="image is-128x128 part-image">
							<img src="assets/arms.png">
						</figure>
						<div class="part-color part-color-${order.arms}">${order.arms}</div>
					</div>
					<div class="order-part column">
						<div class="part-name">Face</div>
						<figure class="image is-128x128 part-image">
							<img src="assets/face.png">
						</figure>
						<div class="part-color part-color-${order.face}">${order.face}</div>
					</div>
					<div class="order-part column">
						<div class="part-name">Eyes</div>
						<figure class="image is-128x128 part-image">
							<img src="assets/eyes.png">
						</figure>
						<div class="part-color part-color-${order.eyes}">${order.eyes}</div>
					</div>
					<div class="order-part column">
						<div class="part-name">Hat</div>
						<figure class="image is-128x128 part-image">
							<img src="assets/hat.png">
						</figure>
						<div class="part-color part-color-${order.hat}">${order.hat}</div>
					</div>
				</div>
			</div>`);
		}
	}
}

ws.onopen = function(event) {
	$("#selectionModal").addClass("is-active");
}

ws.onmessage = function(event) {
	var data = JSON.parse(event.data);
	console.log(data);

	if(data.command == "orders") {
		addOrders(data.assembly, "#assemblyOrders");
		addOrders(data.assurance, "#assuranceOrders");
		addOrders(data.completed, "#completedOrders");
	} else if(data.command == "orders_assembly") {
		$("#assemblyOrders").empty();
		addOrders(data.orders, "#assemblyOrders");
	} else if(data.command == "orders_assurance") {
		$("#assuranceOrders").empty();
		addOrders(data.orders, "#assuranceOrders");
	} else if(data.command == "orders_completed") {
		$("#completedOrders").empty();
		addOrders(data.orders, "#completedOrders");
	} else if(data.command == "info") {
		$("#ordersCompleted").text(data.completed);
		$("#ordersRemaining").text(50 - data.completed);

		$("#orderRequests").text(data.requests);
		$("#orderApprovals").text(data.approvals);

		$("#timeCounter").text(data.timestamp);
	} else if(data.command == "stop") {
		$("#ordersCompletedFinal").text(data.completed);
		$("#timeCounterFinal").text(data.timestamp);
		$("#stopModal").addClass("is-active");
	} else if(data.command == "time") {
		$("#timeCounter").text(data.timestamp);
	}
};