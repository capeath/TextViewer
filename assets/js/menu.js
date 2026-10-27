const { app, Menu, BrowserWindow, dialog } = require( 'electron' )


const isMac = process.platform === 'darwin'

module.exports = function(menuActions) {
    return [
        // { role : appMenu }
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role : 'about' },
                { type : 'separator' },
                { role : 'quit' }
            ]
        }] : []),
        // [ role : file ]
        {
        label : 'File',
        submenu: [
            {
                label : "Open Service",
                click: menuActions.openFile
            },
            {
                label : "Add File",
                click : menuActions.addFile
            },
            {
                label : "Control QR Code",
                click : menuActions.qrCode
            },
            {
                label : "Restart HTTP Server",
                click : menuActions.httpst
            },
            {
                type : 'separator'
            },
            isMac ? { role: "close" } : { role: "quit" }
        ]}]        

    }
