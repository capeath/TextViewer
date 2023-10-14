var wss = require('ws').Server;
var Serv = new wss({ port: 1234});
const serviceOrder = require('./ServiceOrder.json');
var connectName;
var obs;
var cntrl;
var lineNo = -1;
var fileNo = 0;
var lyrics;
var visShow=1;
const prevSlideCSS='<div class="w3-panel w3-card-2 w3-blue" onclick="fnPrev()" style="width:75%"><header class="w3-container w3-indigo"><h5>Previous Slide</h5></header><div class="w3-container"><p>';
const currSlideCSS='<div class="w3-panel w3-card-4 w3-grey" onclick="fnCurr()" style="width:75%"><header class="w3-container w3-dark-grey"><h5>Current Slide</h5></header><div class="w3-container"><p>';
const nextSlideCSS='<div class="w3-panel w3-card-2 w3-red" onclick="fnNext()" style="width:75%"><header class="w3-container w3-pink"><h5>Next Slide</h5></header><div class="w3-container"><p>';
getText(fileNo);
setVis(1);
testStart();

Serv.on('connection', function(ws) {
	var d;
	ws.on('message', function(messageIn) {
		message = JSON.parse(messageIn);
		switch(message.type) {
			case ("name"):
				if (message.data == "control") {
					cntrl=1;
					ws.Usr = "ctrl";
					console.log("Control Connected");
					cmdScreen(0);
					cmdMenu(0);
					setTitle(serviceOrder[fileNo].name);
					if (obs == 1) {
						ws.send(JSON.stringify({
							type: "connect",
							data: "true"
						}));
						vis=true;
						setVis();
						}
				}
				else if (message.data == "obs") {
					obs=1;
					ws.Usr = "obs";
					console.log("OBS Connected");
					if (cntrl == 1) {
						Serv.clients.forEach(function e(client) {
							if (client.Usr == "ctrl") {
								client.send(JSON.stringify({
									type: "connect",
									data: "true"
								}));
							}
						});
			
					}
				}
				break;
			case ("ctrl"):
				switch (message.data) {
					case ("next"):
						lineNo++;
						if (lineNo == lyrics.length-1) {
							showLyrics();					
							cmdScreen(2);
						} else if (lineNo == lyrics.length) {
							fileNo++;
							getText(fileNo);
							cmdMenu(fileNo);
							setVis(0);
							lineNo=-1;
							cmdScreen(0);
							setTitle(serviceOrder[fileNo].name);
							console.log("title file="+fileNo+" name="+serviceOrder[fileNo].name);
						} else {	
							showLyrics();
							cmdScreen(0);
						}
						break;
					case ("prev"):
						lineNo--;
						if (lineNo==-2) {lineNo=-1;}
						if (lineNo==-1 && fileNo>0) {
							fileNo--;
							setTitle(serviceOrder[fileNo].name);
							getText(fileNo);
							cmdMenu(fileNo);
							lineNo=lyrics.length-1;
							obsLyrics(lyrics[lineNo].text);
							cmdScreen(2);
							console.log("title file="+fileNo+" name="+serviceOrder[fileNo].name);
						} else {
							switch (lyrics[lineNo].slide) {
								case ("#"):
								case ("*"):
								case ("@"):
									setVis(0);
									cmdScreen(0);
									break;
								default:
									obsLyrics(lyrics[lineNo].text);
									cmdScreen(0);
									break;
							}
						}
						break;
					case ("hide"):
						visShow=0;
						setVis(0);
						console.log("Visibility set to OFF");
						break;
					case ("show"):
						visShow=1;
						if (!(lineNo<0)) {
							switch (lyrics[lineNo].slide) {
								case ("#"):
									setVis(0);
									cmdScreen(0);
									break;
								default:
									obsLyrics(lyrics[lineNo].text);
									cmdScreen(0);
									break;
							}
						}
						console.log("Visibility set to ON");
						break;
					default:
						var q = JSON.parse(message.data);
						switch (q.type) {
							case "menu":
								fileNo=Number(q.data);
								setVis(0);
								getText(fileNo);
								lineNo=-1;
								cmdScreen(1);
								console.log('Skipped to '+serviceOrder[fileNo].name);
								break;
						}
				}
				break;
			case ("fire"):
				sendData("obs",JSON.stringify({
					type: "fire"
				}));		
				break;
		}
	});	
	ws.on('close', function() {
		if (ws.Usr == "ctrl") {
			cntrl=0;
			setVis(0);
		} else {
			obs=0;
			d = JSON.stringify({
				type: "connect",
				data: "false"
			});
			sendData("ctrl",d);
		}
		console.log (ws.Usr + "closed");
	});
});

function getText(n) {
    if (serviceOrder[n].data == "EOF") {
        setVis(0);
        var d = JSON.stringify({
			type: "screen",
			data: ""
		});
		sendData("ctrl",d);
		d = JSON.stringify({
			type: "menu",
			data: ""
		});
		sendData("ctrl",d);
		d=JSON.stringify({
			type: "title",
			data: "Program Exited"
			});
		sendData("ctrl",d);
		d = JSON.stringify({
			type: "connect",
			data: "f"
		});
		sendData("ctrl",d);
	    process.exit();
	}
	lyrics = require('./data/'+serviceOrder[n].type+"/"+serviceOrder[n].file+'.json');
	console.log('\x1b[31m','Loaded "' + serviceOrder[n].name + '"');
	console.log('\x1b[0m')
}

function setTitle(text) {
	var d = JSON.stringify({
		type: "title",
		data: text
	});
	sendData("ctrl",d);
}

function obsLyrics(text) {
	if (visShow==1) {
		var d = JSON.stringify({
			type: "lyrics",
			data: text
		});
		sendData("obs",d);
	}
	if (serviceOrder[fileNo].licence != null && lineNo==0 ) {
		var d = JSON.stringify({
			type: "licence",
			data: serviceOrder[fileNo].licence
		});
		sendData("obs",d);
	}
}

function cmdScreen(cmd) {
	if (lineNo==-1) {
		var p = '<div class="w3-container">' + currSlideCSS+'Blank First Slide</p></div></div>';
		p = p + nextSlideCSS+lyrics[lineNo+1].text+'</p></div></div></div>';
	} else if (lineNo==0) {
		if (fileNo==0) {
			var p = '<div class="w3-container">' + prevSlideCSS + 'Blank First Slide</p></div></div>';
		} else {
			var p = '<div class="w3-container">' + prevSlideCSS + serviceOrder[fileNo-1].name+'</p></div></div>';
		}
		p = p + currSlideCSS + lyrics[lineNo].text+'</p></div></div>';
		p = p + nextSlideCSS + lyrics[lineNo+1].text+'</p></div></div></div>';
	} else {
		switch (cmd) {
			case (0):
				var p = '<div class="w3-container">' + prevSlideCSS + lyrics[lineNo-1].text+'</p></div></div>';
				p = p + currSlideCSS + lyrics[lineNo].text+'</p></div></div>';
				p = p + nextSlideCSS + lyrics[lineNo+1].text+'</p></div></div></div>';
				break;
			case (1):
				var p = '<div class="w3-container">' + prevSlideCSS + lyrics[lineNo-1].text+'</p></div></div>';
				p = p + currSlideCSS + lyrics[lineNo].text+'</p></div></div>';
				p = p + nextSlideCSS + serviceOrder[fileNo].name +'</p></div></div></div>';
				break;
			case (2):
				var p = '<div class="w3-container">' + prevSlideCSS + lyrics[lineNo-1].text+'</p></div></div>';
                console.log("Last slide");
				p = p + currSlideCSS + lyrics[lineNo].text+'</p></div></div>';
				p = p + nextSlideCSS + serviceOrder[fileNo+1].name +'</p></div><div></div>';
				break;
			case (3):
				var p = '<div class="w3-container">' + prevSlideCSS + lyrics[lineNo-1].text+'</p></div></div>';
				p = p + currSlideCSS + lyrics[lineNo].text+'</p></div></div>';

			}
	}
	var d = JSON.stringify({
		type: "screen",
		data: p
	});
	sendData("ctrl",d);
}

function cmdMenu(m) {
	var p = '<select name="MenuSelect" onchange ="fnMenu(this.value)" id="menuSelect" size="4">';
	serviceOrder.forEach((element, index) => {
		if (serviceOrder[index].name != "EOF") {
			if (index == m ) {
				p += '<option value="' + index + '" selected >' + serviceOrder[index].name + '</option>';
			} else {
				p += '<option value="' + index + '">' + serviceOrder[index].name + '</option>';
			}}});
    p += '</select>';
	var d = JSON.stringify({
		type: "menu",
		data: p
	});
	sendData("ctrl",d);
}


function setVis(v) {
	if (v>0 && visShow>0) {
		var d = JSON.stringify({
			type: "visible",
			data: "t"
		});	
	} else {
		var d = JSON.stringify({
			type: "visible",
			data: "f"
		});
	}
	sendData("obs",d);
}

function sendData(c , p) {
	Serv.clients.forEach(function e(client) {
		if (client.Usr == c) {
			client.send(p);
		}
	});	
}

function obsAnime() {
	var d = JSON.stringify({
		image : lyrics[lineNo].img,
		top : lyrics[lineNo].top,
		bottom : lyrics[lineNo].bottom
	});
	var e = JSON.stringify({
		type: "anime",
		data : d
	})
	sendData("obs",e);
}

function obsAnimeclose() {
	var e = JSON.stringify({
		type: "fire"
	})
	sendData("obs",e);
}

function showLyrics() {
	switch (lyrics[lineNo].slide) {
		case ("#"):
			setVis(0);
			break;
		case ("@"):
			obsAnime();
			break;
		case ("*"):
			console.log("Clear");
			setVis(0);
			obsAnimeclose();
			break;
		default:
			obsLyrics(lyrics[lineNo].text);
			break;
	}

}

function testStart() {
	var ok=true;
	while (serviceOrder[fileNo].data != "EOF") {
		try {
			lyrics = require('./data/'+serviceOrder[fileNo].type+'/'+serviceOrder[fileNo].file+'.json');
		} catch (error) {
			console.error(error);
			ok=false;
		}
		console.log(fileNo + '.) ' + serviceOrder[fileNo].file+'.json');
		fileNo++;
	}
	if (ok) {
		fileNo=0;
		getText(fileNo);
		setVis(1);
		console.log("System is Running OK.  Starting with '"+serviceOrder[fileNo].name+"'.");
	} else {
		console.log("System Load Fail. Press Key to close");
		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.on('data', process.exit.bind(process, 0));
	}
}
