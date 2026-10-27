const QRCode = require('qrcode');
var os = require('os');

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

window.onload = () => {
  const canvas = document.getElementById('qrcode');
  //const url = 'http://'+ip.address()+'/sockets/control.html'; // Replace with the URL or text you want to encode
  const url = 'http://' + String(ipaddr) + ':8000/mobile'; // Replace with the URL or text you want to encode

  QRCode.toCanvas(canvas, url, (error) => {
    if (error) console.error(error);
    console.log('QR code generated!');
  });
};


// we use the 'ip' module in npm to request IP address of the originating //clientvar ip = require('ip');var express = require('express');var app = express();app.get("/",function(req,res){    res.end("Your IP address is " + ip.address());})const PORT = process.env.PORT || 3000;app.listen(PORT, () => {    console.log("Server running on port number" + PORT);});