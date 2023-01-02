var wss = require('ws').Server;
var formidable = require('formidable');
var dt = require('./filesys.js');
var Serv = new wss({ port: 2383});
const serviceOrder = require('./serviceOrder.json');
var connectName;
var obs;
var cntrl;
var lineNo = -1;
var fileNo = 0;
var lyrics;
var visShow=1;
const prevSlideCSS='<div class="w3-panel w3-card-2 w3-blue" onclick="fnPrev()" style="width:75%"><header class="w3-container w3-indigo"><h5>Previous Slide</h5></header><div class="w3-container"><p>';
const currSlideCSS='<div class="w3-panel w3-card-4 w3-grey" onclick="fnVis()" style="width:75%"><header class="w3-container w3-dark-grey"><h5>Current Slide</h5></header><div class="w3-container"><p>';
const nextSlideCSS='<div class="w3-panel w3-card-2 w3-red" onclick="fnNext()" style="width:75%"><header class="w3-container w3-pink"><h5>Next Slide</h5></header><div class="w3-container"><p>';
getText();
setVis(1);
console.log("System is Running OK");

Serv.on('connection', function(ws) {
	ws.on('message', function(messageIn) {
		
		message = JSON.parse(messageIn);
		switch(message.type) {
			case ("name"):
				console.log(message.data);
				if (message.data == "control") {
					cntrl=1;
					ws.Usr = "ctrl";
					console.log("ctl=true");
					cmdScreen(0);
					cmdMenu(0);
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
					console.log("obs=true");
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
						switch (lyrics[lineNo]) {
							case ("BREAK"):
								setVis(0);
								cmdScreen(0);
								break;
							case ("EOF"):
								setVis(0);
								fileNo++;
								cmdScreen(1);
								getText();
								cmdMenu(fileNo);
								lineNo=-1;
								break;
							default:
								obsLyrics(lyrics[lineNo]);
								cmdScreen(0);
								if (lineNo==0) {
									setTitle(serviceOrder[fileNo].name);
									console.log("title file="+fileNo+" name="+serviceOrder[fileNo].name);
								}
								break;
						}
						break;
					case ("prev"):
						lineNo--;
						if (lyrics[lineNo]=="BREAK" || lyrics[lineNo]=="EOF") {
							setVis(0);
							cmdScreen(0);
						} else if (lineNo==-1 && fileNo>0) {
							fileNo--;
							setTitle(serviceOrder[fileNo].name);
							getText();
							cmdMenu(fileNo);
							lineNo=lyrics.length-2;
							setVis(0);
							cmdScreen(2);
						} else {
							obsLyrics(lyrics[lineNo]);
							console.log(message.data);
							cmdScreen(0);
						}
						break;
					case ("hide"):
						visShow=0;
						setVis(0);
						break;
					case ("show"):
						visShow=1;
						obsLyrics(lyrics[lineNo]);
						break;
					default:
						var q = JSON.parse(message.data);
						switch (q.type) {
							case "menu":
								fileNo=q.data;
								setVis(0);
								getText();
								lineNo=-1;
								cmdScreen(1);
								console.log('Skipped to '+serviceOrder[fileNo].name);
								break;
						}
				}
				break;	
		}
	});	
	ws.on('close', function() {
		if (ws.Usr == "ctrl") {
			cntrl=0;
			setVis(0);
		} else {
			obs=0;
			Serv.clients.forEach(function e(client) {
				if (client.Usr == "ctrl") {
					client.send(JSON.stringify({
						type: "connect",
						data: "false"
					}));
				}
			});
		}
		console.log (ws.Usr + "closed");
	});
});

function getText() {
	var L = dt.currentFile(fileNo);
	lyrics = L.split("###");
}

function setTitle(text) {
	Serv.clients.forEach(function e(client) {
		if (client.Usr == "ctrl") {
			client.send(JSON.stringify({
				type: "title",
				data: text
			}));
		}
	});
}

function obsLyrics(text) {
	if (visShow==1) {
		Serv.clients.forEach(function e(client) {
			if (client.Usr == "obs") {
				client.send(JSON.stringify({
					type: "lyrics",
					data: text
				}));
			}
		});
		if (serviceOrder[fileNo].licence != null && lineNo==0 ) {
			Serv.clients.forEach(function e(client) {
				if (client.Usr == "obs") {
					client.send(JSON.stringify({
						type: "licence",
						data: serviceOrder[fileNo].licence
					}));
				}
			});	
		}
	}
}

function cmdScreen(cmd) {
	if (lineNo==-1) {
		var p = '<div class="w3-container">' + currSlideCSS+'Blank First Slide</p></div></div>';
		p = p + nextSlideCSS+lyrics[lineNo+1]+'</p></div></div></div>';
	} else if (lineNo==0) {
		if (fileNo==0) {
			var p = '<div class="w3-container">' + prevSlideCSS + 'Blank First Slide</p></div></div>';
		} else {
			var p = '<div class="w3-container">' + prevSlideCSS + serviceOrder[fileNo-1].name+'</p></div></div>';
		}
		p = p + currSlideCSS + lyrics[lineNo]+'</p></div></div>';
		p = p + nextSlideCSS + lyrics[lineNo+1]+'</p></div></div></div>';
	} else {
		if (cmd==0) {
			var p = '<div class="w3-container">' + prevSlideCSS + lyrics[lineNo-1]+'</p></div></div>';
			p = p + currSlideCSS + lyrics[lineNo]+'</p></div></div>';
			p = p + nextSlideCSS + lyrics[lineNo+1]+'</p></div></div></div>';
		} else if (cmd==1) {
			var p = '<div class="w3-container">' + prevSlideCSS + lyrics[lineNo-1]+'</p></div></div>';
			p = p + currSlideCSS + lyrics[lineNo]+'</p></div></div>';
			p = p + nextSlideCSS + serviceOrder[fileNo].name+'</p></div></div></div>';
		} else {
			var p = '<div class="w3-container">' + prevSlideCSS + lyrics[lineNo-1]+'</p></div></div>';
			p = p + currSlideCSS + lyrics[lineNo]+'</p></div></div>';
			p = p + nextSlideCSS + serviceOrder[fileNo+1].name+'</p></div><div></div>';
		}
	}
	Serv.clients.forEach(function e(client) {
		if (client.Usr == "ctrl") {
			client.send(JSON.stringify({
				type: "screen",
				data: p
			}));
		}
	});
}

function cmdMenu(m) {
	var p = '<select name="MenuSelect" onclick="fnMenu(this.value)" id="menuSelect" size="4">';
	serviceOrder.forEach((element, index) => {
		if (index == m ) {
			p += '<option value="' + index + '" selected >' + serviceOrder[index].name + '</option>';
		} else {
			p += '<option value="' + index + '">' + serviceOrder[index].name + '</option>';
		}});
    p += '</select>';
	Serv.clients.forEach(function e(client) {
		if (client.Usr == "ctrl") {
			client.send(JSON.stringify({
				type: "menu",
				data: p
			}));
		}
	});
}

function setVis(v) {
	Serv.clients.forEach(function e(client) {
		if (client.Usr == "obs") {
			if (v>0 && visShow>0) {
				client.send(JSON.stringify({
					type: "visible",
					data: "t"
				}));	
			} else {
				client.send(JSON.stringify({
					type: "visible",
					data: "f"
				}));
			}
		}
	});
}