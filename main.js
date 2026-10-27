const {app, BrowserWindow, ipcMain, Menu, MenuItem, dialog} = require("electron");
var QRCode = require('qrcode');
const path = require('path');
const os = require('os');
var fs = require('fs');
var wss = require('ws').Server;
var Serv = new wss({ port: 2383});
const http = require("http");
const stream = require('node:stream');
const process = require('process');
const port = 8000;
var serviceOrder, obs, cntrl, dir, viewText, activeFile, service, soDir, lastLine;
var lineNo = -1;
var fileNo = 0;
var visShow=1;
var active=0;
var ServiceFile;
const prevSlideCSS='<div class="w3-panel w3-card-2 w3-blue" onclick="fnPrev()" style="width:75%"><header class="w3-container w3-indigo"><h5>Previous Slide</h5></header><div class="w3-container"><p>';
const currSlideCSS='<div class="w3-panel w3-card-4 ';
const currSlideCSS2 = '" onclick="fnCurr()" style="width:75%"><header class="w3-container w3-dark-grey"><h5>';
const currSlideCSS3 = '</h5></header><div class="w3-container"><p>';
const nextSlideCSS='<div class="w3-panel w3-card-2 w3-red" onclick="fnNext()" style="width:75%"><header class="w3-container w3-pink"><h5>Next Slide</h5></header><div class="w3-container"><p>';
const prevDirCSS='<div class="w3-panel w3-card-2 w3-blue" onclick="fnNav(\'prev\')"><div class="w3-container"><p>';
const currDirCSS='<div class="w3-panel w3-card-4 ';
const currDirCSS2 = '" onclick="fnNav(\'curr\')"><div class="w3-container"><p>';
const nextDirCSS='<div class="w3-panel w3-card-2 w3-red" onclick="fnNav(\'next\')"><div class="w3-container"><p>';

var interfaces = os.networkInterfaces();
var ipaddr = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            ipaddr.push(address.address);
        }
    }
}
const host = ipaddr;

const requestListener = function (req, res) {
    console.log(req.url);
    switch (req.url) {
        case "/obs":
			var contents;
			if (!active) {
				res.setHeader("Content-Type", "text/html");
				res.writeHead(200);
				contents = fs.readFileSync(path.join(__dirname,'assets','html','blank.html'));
				res.end(contents);
			} else {
				var contents1 = fs.readFileSync(soDir + "/assets/html/" + service.obs);
				contents1 = contents1 + " ";
				var contents = contents1.replace(/localhost/g,ipaddr);
				res.setHeader("Content-Type", "text/html");
				res.writeHead(200);
				res.end(contents);
			}
            break;
        case "/lyriccss" :
            res.writeHead(200, {"Content-Type": "text/css"});
            fs.createReadStream(soDir + '/assets/css/'+service.lyric).pipe(res);
            break;
        case "/anicss" :
            res.writeHead(200, {"Content-Type": "text/css"});
            fs.createReadStream(soDir + '/assets/css/'+service.ani).pipe(res);
            break;           
        case "/icon" :
            res.writeHead(200, {"Content-Type" : "image/png"});
            fs.createReadStream(soDir + "/pics/"+service.ilyric).pipe(res);
            break;
        case "/favicon.ico" :
            res.writeHead(200, {"Content-Type" : "image/png"});
            fs.createReadStream(path.join(__dirname,"config","Icon.png")).pipe(res);
            break;
		case "/mobile" :
            var contents1 = fs.readFileSync(path.join(__dirname,"assets",'html',"mobile.html"));
			contents1 = contents1 + " ";
            var contents = contents1.replace(/localhost/g,ipaddr);
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            res.end(contents);
            break;
		default :
			var url = req.url;
			let png = url.endsWith("png");
			if (png) {
				res.writeHead(200, {"Content-Type" : "image/png"});
				fs.createReadStream(soDir + "/pics" + req.url).pipe(res);
			}
			let jpg = url.endsWith("jpg");
			if (jpg) {
				res.writeHead(200, {"Content-Type" : "image/jpg"});
				fs.createReadStream(soDir + "/pics" + req.url).pipe(res);
			}
			break;
    }

};

const httpServer = http.createServer(requestListener);
httpServer.listen(port, host, () => {
	console.log(`Server is running on http://${host}:${port}`);
});

const menuActions = {
	openFile : function () {
		// construct the select file dialog 
		let winOpen = BrowserWindow.getFocusedWindow();
		let options = {
			title : 'Open a your order of service file',
			filters: [
				{ name: 'JSON', extensions: ['json']}
			]
		};
		dialog.showOpenDialog(winOpen, options).then
		(function(fileObj) {
			// the fileObj has two props 
			if (!fileObj.canceled) {
				ServiceFile = fileObj.filePaths[0];
				service = JSON.parse(fs.readFileSync(ServiceFile, 'utf8'));
				serviceOrder = service.service;
				soDir = path.dirname(ServiceFile);
				win.setIcon(path.join(__dirname,'config','Icon.png'));
				testStart();
			}
		})
		// should always handle the error yourself, later Electron release might crash if you don't 
		.catch(function(err) {
			console.error(err)  
		})
	},
	addFile : function () {
		console.log("Adding a File");
	},
	qrCode : function () {
		const modalWindow = new BrowserWindow({
			parent: win,
			modal: true,
			show: false,
			width: 300,
			height: 300,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false
			}
		});
	
		modalWindow.loadFile(path.join(__dirname,'assets','html','modal.html'));

		modalWindow.once('ready-to-show', () => {
			modalWindow.show();
		});
	}
};
let mainMenu = Menu.buildFromTemplate(require(path.join(__dirname,'assets','js','menu.js'))(menuActions));

let win = null;

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 540,
		icon:path.join(__dirname,'config','Icon.png'),
        webPreferences: {
            preload: path.join(__dirname,"assets","js",'preload.js')
        }
    })
	
	win.setTitle("Textviewer");
    //win.webContents.openDevTools();

	Menu.setApplicationMenu(mainMenu);
	win.loadFile(path.join(__dirname,'assets','html','index.html'));
}

ipcMain.on('command', (event, data) => {
    switch(data) {
        case "close":
            setVis(0);
            var d = JSON.stringify({
                type: "screen",
                data: ""
            });
            sendData("ctrl",d);
            sendData("dir",d);
            d = JSON.stringify({
                type: "menu",
                data: ""
            });
            sendData("ctrl",d);
            sendData("dir",d);
            d=JSON.stringify({
                type: "title",
                data: "Program Exited"
                });
            sendData("ctrl",d);
            sendData("dir",d);
            d = JSON.stringify({
                type: "connect",
                data: "f"
            });
            sendData("ctrl",d);
            sendData("dir",d);
            process.exit();
            break;
        case "start":
			active = 1;
            cmdMenu(fileNo);
            setTitle(serviceOrder[fileNo].name);
            getText(fileNo);
            checkConnections();
            break;
		case "restart":
			active = 1;
			fileNo=0;
			cmdMenu(fileNo);
			setTitle(serviceOrder[fileNo].name);
			getText(fileNo);
			checkConnections();
			break;
        }
})

ipcMain.on('nav', (event,data) => {
    switch (data) {
        case ("next"):
            lineNo++;
            if (lineNo == viewText.length-1) {
                showLyrics();					
                cmdScreen(0);
            } else if (lineNo == viewText.length) {
                fileNo++;
                lineNo=-1;
                getText(fileNo);
				if (!active) {break;};
                cmdMenu(fileNo);
                obsView(0);
                setTitle(serviceOrder[fileNo].name);
                win.webContents.send('foot',"<h3></h3>");
            } else {	
                showLyrics();
                cmdScreen(0);
            }
            break;
        case ("prev"):
            lineNo--;
            if (lineNo==-2) {lineNo=-1;}
            if (lineNo==-1 && fileNo==0) {}
            else if (lineNo==-1 && fileNo>0) {
                fileNo--;
                setTitle(serviceOrder[fileNo].name);
                getText(fileNo);
				if (!active) {break;};
                cmdMenu(fileNo);
                lineNo=viewText.length-1;
                obsLyrics(viewText[lineNo].text);
                cmdScreen(0);
                win.webContents.send('footer',"<h3>title file="+fileNo+" name="+serviceOrder[fileNo].name+'</h3>');
            } else {
                switch (viewText[lineNo].slide) {
                    case ("#"):
                    case ("*"):
                    case ("@"):
                        obsView(0);
                        cmdScreen(0);
                        break;
                    default:
                        obsLyrics(viewText[lineNo].text);
                        obsView(1);
                        cmdScreen(0);
                        break;
                }
            }
            break;
        case ("curr"):
            if (visShow < 1) {
                visShow = 1;
            } else {
                visShow=0;
            }	
            setVis(visShow);
            cmdScreen(0);
            break;
    }
})

ipcMain.on("Navi", (event,data)=> {
	fileNo=Number(data);
	obsView(0);
	getText(fileNo);
	if (active) {
		lineNo=-1;
		cmdScreen(0);
		cmdMenu(fileNo);
		foot = '<h3>Skipped to '+serviceOrder[fileNo].name+"</h3>";
		win.webContents.send("footer",foot);
		setTitle(serviceOrder[fileNo].name);
	};
})

app.whenReady().then(createWindow);



Serv.on('connection', function(ws) {
	var d;
	if (active) {
	ws.on('message', function(messageIn) {
		message = JSON.parse(messageIn);
		ws.isAlive = true;
		clearInterval(ws.heartbeat);
		switch(message.type) {
			case ("ping"):
				ws.isAlive = true;
				sendData(ws.Usr,JSON.stringify({
					type:"pong"
				}))
				break;
			case ("name"):
				if (message.data == "control") {
					cntrl=1;
					ws.Usr = "ctrl";
					ws.isAlive = true;
					cmdMenu(fileNo);
					setTitle(serviceOrder[fileNo].name);
					if (obs == 1) {
						ws.send(JSON.stringify({
							type: "connect",
							data: "true"
						}));
						}
					if (visShow == 1) {
						var q = JSON.stringify({
							type: "visible",
							data: "true"
						})
						sendData("ctrl",q);
					}
				}
				else if (message.data == "obs") {
					obs=1;
					ws.Usr = "obs";
					ws.isAlive = true;
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
				checkConnections();
				break;
			case ("ctrl"):
				switch (message.data) {
					case ("next"):
						lineNo++;
						if (lineNo == viewText.length-1) {
							showLyrics();					
							cmdScreen(0);
						} else if (lineNo == viewText.length) {
							fileNo++;
							lineNo=-1;
							getText(fileNo);
							if (!active) {break;};
							cmdMenu(fileNo);
							obsView(0);
							setTitle(serviceOrder[fileNo].name);
                        } else {	
							showLyrics();
							cmdScreen(0);
						}
						break;
					case ("prev"):
						lineNo--;
						if (lineNo==-2) {lineNo=-1;}
						if (lineNo==-1 && fileNo==0) {}
						else if (lineNo==-1 && fileNo>0) {
							fileNo--;
							setTitle(serviceOrder[fileNo].name);
							getText(fileNo);
							if (!active) {break;};
							cmdMenu(fileNo);
							lineNo=viewText.length-1;
							obsLyrics(viewText[lineNo].text);
							cmdScreen(0);
						} else {
							switch (viewText[lineNo].slide) {
								case ("#"):
								case ("*"):
								case ("@"):
									obsView(0);
									cmdScreen(0);
									break;
								default:
									obsLyrics(viewText[lineNo].text);
									obsView(1);
									cmdScreen(0);
									break;
							}
						}
						break;
					case ("vis"):
						if (visShow < 1) {
							visShow = 1;
						} else {
							visShow=0;
						}
						setVis(visShow);
						cmdScreen(0);
						break;
					default:
						var q = JSON.parse(message.data);
						switch (q.type) {
							case "menu":
								fileNo=Number(q.data);
								obsView(0);
								getText(fileNo);
								if (!active) {break;};
								lineNo=-1;
								cmdScreen(0);
								cmdMenu(fileNo);
								foot = '<h3>Skipped to '+serviceOrder[fileNo].name+"</h3>";
                                win.webContents.send("footer",foot);
								setTitle(serviceOrder[fileNo].name);
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
		terminate(Serv.clients);
	} );
}});

ipcMain.on("MenuCmd", (event,data)=> {
	// open new BrowserWindow
			console.log ("You selected opening file");
})

function terminate (client) {
	if (client.Usr == "ctrl") {
		cntrl = 0;
		if (dir != 1) { 
			setVis(0);
		}
	} else if (client.Usr == "dir") {
		dir = 0;
		if (cntrl != 1) { 
			setVis(0);
		}
	} else {
		obs=0;
		d = JSON.stringify({
			type: "connect",
			data: "false"
		});
		sendData("ctrl",d);
		sendData("dir",d);
	}
	checkConnections();
};

function getText(n) {
    if (serviceOrder[n].data == "EOF") {
		fnEndService();
	} else {
	activeFile = require(soDir + '/' + serviceOrder[n].type+"/"+serviceOrder[n].file+'.json');
	viewText = activeFile.lyrics;
	var foot = '<h4>Loaded "' + serviceOrder[n].name + '"</h4>';
	win.webContents.send('footer', foot);
	}
}

function setTitle(text) {
	var d = JSON.stringify({
		type: "title",
		data: text
	});
	sendData("ctrl",d);
	win.webContents.send('header','<h1>'+text+'</h1>');
}

function doMnuCmd(v) {
	console.log(v);
}

function obsLyrics(text) {
	if (visShow==1) {
		var d = JSON.stringify({
			type: "lyrics",
			data: text
		});
		sendData("obs",d);
	}
	if (activeFile.license != null && lineNo==0 ) {
		var d = JSON.stringify({
			type: "license",
			data: activeFile.license
		});
		sendData("obs",d);
	}
}

function cmdScreen(m) {
	if (visShow==1) {
		var cur="w3-grey";
		var title = "Current Slide";
	} else {
		var cur="w3-white";
		var title = "Slide is not Visible";
	}
	if (lineNo==-1 && fileNo==0) {
		var p = '<div class="w3-container">' + currSlideCSS + cur + currSlideCSS2 + title + currSlideCSS3 + 'Blank First Slide</p></div></div>';
		p = p + nextSlideCSS + viewText[lineNo+1].text+'</p></div></div></div>';
		var q = '<div class="w3-container">' + currDirCSS + cur + currDirCSS2 + 'Blank First Slide</p></div></div>';
		q = q + nextDirCSS+viewText[lineNo+1].text+'</p></div></div></div>';
	} else if (lineNo==-1) {
		var p = '<div class="w3-container">' + prevSlideCSS + lastLine + '</p></div></div>';
		var q = '<div class="w3-container">' + prevDirCSS + lastLine + '</p></div></div>';	
		p = p + '<div class="w3-container">' + currSlideCSS + cur + currSlideCSS2 + title + currSlideCSS3 + '<i>(' + serviceOrder[fileNo].name + ') - Blank Slide</i></p></div></div>';
		p = p + nextSlideCSS+viewText[lineNo+1].text+'</p></div></div></div>';
		q = q + '<div class="w3-container">' + currDirCSS + cur + currDirCSS2 + '<i>(' + serviceOrder[fileNo].name + ') - Blank Slide</i></p></div></div>';
		q = q + nextDirCSS+viewText[lineNo+1].text+'</p></div></div></div>';
	} else if (lineNo==0) {
		if (fileNo==0) {
			var p = '<div class="w3-container">' + prevSlideCSS + 'Blank First Slide</p></div></div>';
			var q = '<div class="w3-container">' + prevDirCSS + 'Blank First Slide</p></div></div>';
		} else {
			var p = '<div class="w3-container">' + prevSlideCSS + lastLine +'</p></div></div>';
			var q = '<div class="w3-container">' + prevDirCSS + lastLine + '</p></div></div>';
		}
		p = p + currSlideCSS + cur + currSlideCSS2 + title + currSlideCSS3 +  viewText[lineNo].text+'</p></div></div>';
		p = p + nextSlideCSS + viewText[lineNo+1].text+'</p></div></div></div>';
		q = q + currDirCSS + cur + currDirCSS2 + viewText[lineNo].text+'</p></div></div>';
		q = q + nextDirCSS + viewText[lineNo+1].text+'</p></div></div></div>';
	} else if (lineNo == viewText.length-1) {
		var p = '<div class="w3-container">' + prevSlideCSS + viewText[lineNo-1].text+'</p></div></div>';
		win.webContents.send('footer',"<h4>Last slide</h4>");
		lastLine = lastLine = viewText[lineNo].text;
		p = p + currSlideCSS + cur + currSlideCSS2 + title + currSlideCSS3 + viewText[lineNo].text+'</p></div></div>';
		p = p + nextSlideCSS + '<i>(' + serviceOrder[fileNo+1].name + ') - Blank Slide</i></p></div><div></div>';
		var q = '<div class="w3-container">' + prevDirCSS + viewText[lineNo-1].text+'</p></div></div>';
		q = q + currDirCSS + cur + currDirCSS2 + viewText[lineNo].text + '</p></div></div>';
		q = q + nextDirCSS + '<i>(' + serviceOrder[fileNo+1].name + ') - Blank Slide</i></p></div><div></div>';
	} else {
		var p = '<div class="w3-container">' + prevSlideCSS + viewText[lineNo-1].text+'</p></div></div>';
		p = p + currSlideCSS + cur + currSlideCSS2 + title + currSlideCSS3 + viewText[lineNo].text+'</p></div></div>';
		p = p + nextSlideCSS + viewText[lineNo+1].text+'</p></div></div></div>';
		var q = '<div class="w3-container">' + prevDirCSS + viewText[lineNo-1].text+'</p></div></div>';
		q = q + currDirCSS + cur + currDirCSS2 + viewText[lineNo].text+'</p></div></div>';
		q = q + nextDirCSS + viewText[lineNo+1].text+'</p></div></div></div>';
		let slideCount = viewText.length - lineNo;
		win.webContents.send('footer',"<h4>" + slideCount + " slides remain</h4>");
	}
	var d = JSON.stringify({
		type: "screen",
		data: p
	});
	sendData("ctrl",d);
	win.webContents.send("control",q);
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
	cmdScreen(0);
	sendData("ctrl",d);
	win.webContents.send('Navi', p);
}

function obsView(v) {
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

function setVis(v) {
	if (lineNo > -1) {
		switch (viewText[lineNo].slide) {
			case ("#"):
			case ("*"):
			case ("@"):
				obsView(0);
			default:
				obsView(v);
		}
	}
	if (v>0 && visShow>0) {
		win.webContents.send('footer','<h2>Visibility set to On</h2>');
		if (lineNo > -1) {
			showLyrics();
			var q = JSON.stringify({
				type: "visible",
				data: "true"
			})	
		}
	} else {
		win.webContents.send('footer','<h2>Visibility set to Off</h2>');
		var q = JSON.stringify({
			type: "visible",
			data: "false"
		})	
	}
	sendData("ctrl",q);
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
		image : viewText[lineNo].img,
		top : viewText[lineNo].top,
		bottom : viewText[lineNo].bottom
	});
	var e = JSON.stringify({
		type: "anime",
		data : d
	})
	if (visShow > 0) {
		sendData("obs",e);
	}
}

function obsAnimeclose() {
	var e = JSON.stringify({
		type: "fire"
	})
	sendData("obs",e);
}

function showLyrics() {
	switch (viewText[lineNo].slide) {
		case ("#"):
			obsView(0);
			break;
		case ("@"):
			obsAnime();
			break;
		case ("*"):
			win.webContents.send('footer',"<h2>Clear Animation</h2>");
			obsView(0);
			obsAnimeclose();
			break;
		default:
			obsLyrics(viewText[lineNo].text);
			obsView(1);
			break;
	}

}

function testStart() {
	var ok=true;
	var exception;
    var e = "<p>";
    var out = "<h6>Testing Results</h6><p>";
    win.webContents.send('header', '<h1>Program Precheck</h1>');
	while (serviceOrder[fileNo].data != "EOF") {
		exception = false;
		try {
			activeFile = require(soDir + '/' + serviceOrder[fileNo].type+'/'+serviceOrder[fileNo].file+'.json');
		} catch (error) {
			e = e + soDir + '/' + serviceOrder[fileNo].type + '/' + serviceOrder[fileNo].file+'.json failed to load.<br>Song = '+serviceOrder[fileNo].name+"<br>";
			ok=false;
			exception = true;
		} finally {
			if (!exception) {
				out = out +  fileNo + '.) ' + serviceOrder[fileNo].file+'.json loaded properly<br>';
			}
		}
		fileNo++;
	}
    out = out + '</p>';
    e = e + '</p>';
	if (ok) {
		fileNo=0;
		getText(fileNo);
		setVis(1);
        win.webContents.send('control', out);
        var butt='<button class="commands" onclick="buttons(\'start\')" class="w3-button w3-large-round w3-padding-24" style="background-color:#37554c;">OK</button>';
        win.webContents.send('butt', butt);
        win.webContents.send('footer', '<h1>Load Successful</h1>');
	} else {
        e = e + '<p class="w3-red">System Load Fail.</p>';
		out = out + e;
        win.webContents.send('control', out);
        var butt='<button class="commands" onclick="buttons(\'close\')" class="w3-button w3-large-round w3-red">CLOSE</button>';
        win.webContents.send('butt', butt);
        win.webContents.send('foot',"<h1 style='color:red;'>Load Failed</h1>");
	}
}


var c=0;
const heartbeat = setInterval (() => {
	if (active) {
		Serv.clients.forEach(function e(client) {
			if (!client.isAlive) {
				terminate(client);
				win.webContents.send('foot','<h1 class="w3-purple">'+client.Usr + ' ping failed</h1>');
			} else {
				client.isAlive=false;
				p=JSON.stringify({
					type: "ping"
				})
				client.send(p);
			}
		});
	};	
},5000);

function checkConnections() {
    var one=0;
	if (active) {
    var t = '<ul class = "w3-ul w3-large-round w3-center">';
    Serv.clients.forEach(function e(client) {
		if (client.Usr == 'ctrl') {
			t = t + '<li class = "w3-red">Control</li>';
            one = one + 1;
		}
        if (client.Usr == 'obs') {
            t = t + '<li class = "w3-blue">OBS</li>';
            one = one +1;
        }
        if (client.Usr == 'over') {
            t = t + '<li class = "w3-green">Overhead</li>';
            one = one + 1;
        }
	});	
    t = t + "</ul>";
    if (one < 1) {t="<h4>Nothing Connected</h4>";}
    win.webContents.send('butt',t);};
}

function fnEndService() {
	active=0;
	console.log("end of Service");
	obsView(0);
	var d = JSON.stringify({
		type: "screen",
		data: ""
	});
	sendData("ctrl",d);
	d = JSON.stringify({
		type: "menu",
		data: ""
	});
	console.log("sending blanking data.");
	sendData("ctrl",d);
	d=JSON.stringify({
		type: "title",
		data: "End of Service"
		});
	sendData("ctrl",d);
	out='<button class="commands" onclick="buttons(\'restart\')" class="w3-button w3-large-round w3-padding-24" style="background-color:#37554c;">Restart</button><br><button class="commands" onclick="buttons(\'close\')" class="w3-button w3-large-round w3-padding-24" style="background-color:#37554c;">Close Program</button>';
	win.webContents.send('control', out);
	butt = '';
	win.webContents.send('butt', butt);
	win.webContents.send("Navi",butt);
	win.webContents.send('foot',"<h1 style='color:red;'>End of Service</h1>");
	win.webContents.send('header', '<h1>Service Ended</h1>');
}

