var canvas = null;
var context = null;
var frame = null;
var img = null;
var transition = null;
var currentPage = "#/employee";
var images = {};
var drawings = {
	"#/employee": { images: [{ url: "/img/welcome.png", xPos: 0, yPos: 0, width: 1000, height: 740, alpha: 1 }] },
	"#/shoppinglist": { images: [{ url: "/img/shoppinglist.png", xPos: 0, yPos: 0, width: 1000, height: 740, alpha: 1 }] },
	"#/purchase-orders": { images: [{ url: "/img/polist.png", xPos: 0, yPos: 0, width: 1000, height: 740, alpha: 1 }] },
	"#/purchase-orders-details": { images: [{ url: "/img/podetails.png", xPos: 0, yPos: 0, width: 1000, height: 740, alpha: 1 }] }
};
var hovers = {
	"shop": "",
	"po": "",
	"partner": ""
};

function getDrawing(page) {
	var draw;
	if(page.indexOf("#/purchase-orders/") > -1) {
		draw = drawings["#/purchase-orders-details"];
	} else {
		var draw = drawings[page];
	}
	return draw;
}

function drawPage(page, alpha) {
	if (alpha == null) {
		alpha = 1;
	}
	context.clearRect(0, 0, canvas.width, canvas.height);
	var draw = getDrawing(page);
	for (var i = 0; draw.images && i < draw.images.length; i++) {
		drawImg(draw.images[i], alpha);
	}
	for (var i = 0; draw.text && i < draw.text.length; i++) {
		drawText(draw.text[i], alpha);
	}
};

function loadPage(page, callback, param) {
	var draw = getDrawing(page);

	for (var i = 0; i < draw.images.length; i++) {
		if (!images[draw.images[i].url]) {
			img = new Image();
			img.src = draw.images[i].url;
			images[draw.images[i].url] = img;
			img.onload = function () {
				callback(param);
			};
		}
	}
};

function drawImg(image, alpha) {
	image.alpha = image.alpha || 1;
	img = images[image.url];
	context.globalAlpha = image.alpha * alpha;
	context.drawImage(img, image.xPos, image.yPos, image.width, image.height);
};

function drawText(text, alpha) {
	text.alpha = text.alpha || 1;
	context.font = text.font || "48px sans-serif";
	context.fillStyle = text.color || "black";
	context.globalAlpha = text.alpha * alpha;
	wrapText(context, text.txt, text.xPos, text.yPos, canvas.width - 100, 40);
	//context.fillText(text.txt, text.xPos, text.yPos);
};

function fadePageOut(page, alpha) {
	drawPage(page, alpha);
	if (alpha > 0) {
		transition = setTimeout(fadePageOut, 9, page, alpha - .02);
	}
	else {
		fadePageIn(currentPage, 0);
	}
};

function fadePageIn(page, alpha) {
	drawPage(page, alpha);
	if (alpha < 1) {
		transition = setTimeout(fadePageIn, 12, page, alpha + .01);
	}
};

function frameClicked(evt) {
	setTimeout(function () {
		if (currentPage !== frame.location.hash) {
			clearTimeout(transition);
			fadePageOut(currentPage, 1);
			currentPage = frame.location.hash;
			loadPage(currentPage);
		}
	}, 50);
};

function frameHover(evt) {
	var id = evt.toElement.id;
	if (!id) {
		id = evt.toElement.parentElement.id;
	}
	console.log("hovered over " + id);
};

function showClick() {
	document.getElementById("canvasCell").style.display = "block";
	document.getElementById("showButton").style.display = "none";
};

function hideClick() {
	document.getElementById("canvasCell").style.display = "none";
	document.getElementById("showButton").style.display = "block";
};

function revealHideButton(mousedover) {
	if (mousedover) {
		document.getElementById("hideButton").style.display = "block";
	}
	else {
		document.getElementById("hideButton").style.display = "none";
	}
};

function wrapText(context, text, x, y, maxWidth, lineHeight) {
	var words = text.split(' ');
	var line = '';
	var testLine = '';
	var metrics = '';
	var testWidth = '';
	for (var n = 0; n < words.length; n++) {
		testLine = line + words[n] + ' ';
		metrics = context.measureText(testLine);
		testWidth = metrics.width;
		if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
		}
		else {
            line = testLine;
		}
	}
	context.fillText(line, x, y);
}

window.onload = function () {
	frame = document.getElementById("phone-frame").contentDocument;
	frame.addEventListener("click", frameClicked);
	//frame.addEventListener("mouseover", frameHover);
	canvas = document.getElementById('infocanvas');
	context = canvas.getContext("2d");
	loadPage(currentPage, drawPage, currentPage);
	loadPage("#/shoppinglist");
}
