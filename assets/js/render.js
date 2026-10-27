

function buttons(v) {
    window.electron.sendCommand(v);
    document.getElementById ('butts') .innerHTML = "<h5>BUTTS</h5>";
}

function rndMenuCmd(v) {
    windows.electron.MenuCmd(v);
    document.getElementById( "butts" ) .innerHTML = "Renderer";
}

