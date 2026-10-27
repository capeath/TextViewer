const {
    contextBridge,
    ipcRenderer
} = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electron',
    {
        sendCommand: (v) => ipcRenderer.send('command',v),
        sendNav: (v)=> ipcRenderer.send('nav', v),
        goNavi: (v) => ipcRenderer.send("Navi", v),
        mnuCmd: (v) => ipcRenderer.send('MenuCmd', v)
    }
);


ipcRenderer.on('receivePassword', (event,data) => {
    alert(data);
})

ipcRenderer.on('control', (event,data) => {
    document.getElementById ("dir") .innerHTML = data;
})

ipcRenderer.on("butt", (event,data) => {
    document.getElementById ("butts") .innerHTML = data;
})

ipcRenderer.on("header", (event,data) => {
    document.getElementById ("head") .innerHTML = data;
})

ipcRenderer.on("footer", (event,data) => {
    document.getElementById ("foot") .innerHTML = data;
})

ipcRenderer.on("Navi", (event,data) => {
    document.getElementById ("nav") .innerHTML = data;
})

ipcRenderer.on("MenuCmd", (event,data) => {
    alert("File - " + data);
    fnMenu(data);
})

ipcRenderer.on("File_Open", (event, args) => {
    
})

ipcRenderer.on('qr-code-url', (event, qrCodeUrl) => {
    document.getElementById('qr-code').src = qrCodeUrl;
});