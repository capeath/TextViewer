This is a proof-of-concept of a websocket based lower-thirds display. This is similar to Pro-Presenter in idea but I didn’t like how the program worked.  This uses a NodeJS program to read a service file (ServiceOrder.json) written in ‘.json’. It consists of the following tags:

name – This is the name of the current file. This is used for navigation of the control socket.
type – This is actually a directory in /data to help with sorting the available files.  I use “pics”, 
“psalms”, “songs”, and “text”.  They just need to match directory names.
file – This is the file name missing the .json extension.
licence – This is your license data for your song.  These need to be purchased separately.  I just realized I spelled the word wrong in the code. Oops.

Inside the .json files you save in the /data directories, the markup is as such:
slide – This is the label for the type of slide
text – This is the text displayed on the slide.  Use <br> for line breaks.
img – This is the image file in the /data/pics directory.
top – This is the top line in the animation.
bottom – This is the bottom line in the animation.
data – Currently only used for the “EOF” to mark end of file.  This will cause the program to close.

Type of slides:
! = This is normal slide.
# = This is a blank slide.  The lower-thirds disappears from view. The ‘text’ field is just seen by the control socket.
@= This is an animated slide.  It requires an img, top, and bottom field.  The ‘text’ field is just seen by the control socket.
* = This causes the animated slide to disappear. The ‘text’ field is just seen by the control socket.

obs.html is used by OBS in the browser object.  It is set up to be in 720p regardless of the underlying canvas size.  This is how the tabulation and animation is set up.  If you make it more than that, it will not look right. It should be set with a width of 1366, a height of 600, and the top should be 754px from the top.

control.html is used to control the program.  It was intended to be run on a tablet, but is really functional on any web browser with the needed width.  It can be run in OBS as a custom browser dock, but doesn’t fit perfectly.

Make sure the correct IP is put in the two html files so they can connect to the server.  Also, the obs.html, if served from an actual web server will need to have the correct directories in the code so it can find the directory of the pictures and css files.  This can be set up however you want.  

You can reach out to me at membership at eshorton.com


