var dashMetrics;
var metrics;
var player;
var levelHistory = new Array();
var bitrateHistory = new Array();

function setup() {

	var url = "/uvic_dji/uvic_dji_3qual_single-segment.mpd";
	player = dashjs.MediaPlayer().create();
	player.initialize(document.querySelector("#videoPlayer"), url, false);

	player.getDebug().setLogToBrowserConsole(false);

	player.on(dashjs.MediaPlayer.events.CAN_PLAY, () => {
		metrics = player.getMetricsFor('video');
		dashMetrics = player.getDashMetrics();
		windowResized();
	});

	createCanvas(windowWidth - 16, windowHeight - document.getElementById("videoPlayer").clientHeight - 32);
}



function draw() {
	background(255, 255, 255);
	textSize(12);
	noStroke();

	// Wait for player can play
	if (!!dashMetrics) {
		metrics = player.getMetricsFor('video');
		let dpi = 300;

		drawBufferLevel(dpi);
		drawBandwidthRepresentation(dpi);
		drawTotalDownload(dpi);
	}
}

function drawBufferLevel(dpi){
	// Updates the contents of levelHistory
	fill(100, 100, 255);
	let currentLevel = dashMetrics.getCurrentBufferLevel(metrics);
	levelHistory.unshift(currentLevel);
	if (levelHistory.length > dpi) {
		levelHistory.pop();
	}

	// Draws the contents of levelHistory
	levelHistory.forEach((level, i) => {
		rect(width - i*width/dpi, height - height*level/100, width/dpi + 1, height*level/100);
	});

	// Draws the label for levelHistory
	text(currentLevel + " s", width - 50, height - height/100 * currentLevel - height/25 );
}

function drawBandwidthRepresentation(dpi) {
	// Updates the contents of bitrateHistory
	fill(255, 100, 100);
	const representationId = dashMetrics.getCurrentRepresentationSwitch(metrics).to;
	const periodId = player.getActiveStream().getStreamInfo().index;
	let bandwidth = dashMetrics.getBandwidthForRepresentation(representationId, periodId) / 1e6;

	// Draws the labels for the different MPD representations
	let bitrates = player.getBitrateInfoListFor("video").map(i => i.bitrate);
	let maxbitrate = bitrates.reduce((i, n) => i > n ? i : n, 0);
	maxbitrate = Math.ceil(maxbitrate / 1e6) * 1e6;

	textSize(8);
	bitrates.forEach((mpdrate) => {
		rect(0, height - height*mpdrate/maxbitrate, 10, 2);
		text(Number(mpdrate/1e6).toFixed(2) + " MB/s", 0, height - height*mpdrate/maxbitrate - 2);
	});

	// Updates the bitrateHistory
	bitrateHistory.unshift(bandwidth);
	if (bitrateHistory.length > dpi) {
		bitrateHistory.pop();
	}

	// Draws the contents of bitrateHistory
	bitrateHistory.forEach((bitrate, i) => {
		rect(
			width - i * width/dpi, // Divide the width into dpi sections, and use the ith 
			height - height * bitrate/(maxbitrate/1e6), // Same for the heigt, but with maxbitrate
			width/dpi + 1,
			2
		);
	});

	// Draws the label for bitrateHistory
	textSize(12);
	text(
		(bandwidth || 0) + " MB/s",
		width - 80,
		height - height/(maxbitrate / 1e6) * bandwidth - height/25
	);

}

function drawTotalDownload(dpi) {
	fill(75, 150, 75);
	const requests = dashMetrics.getHttpRequests(metrics);
	const add = (x1, x2) => x1 + x2;
	const total = requests.map(request =>
		request.trace.map(trace =>
			trace.b
			.reduce(add, 0))
		.reduce(add, 0))
	.reduce(add, 0);

	textSize(14);
	text(`Total bytes received = ${Number(total / 1e6).toFixed(2)} MB`, 0, 14);
}

function windowResized() {
	resizeCanvas(windowWidth - 16, windowHeight - document.getElementById("videoPlayer").clientHeight - 32);
}