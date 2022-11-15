require("FontTeletext10x18Ascii").add(Graphics);
require('DateExt'); // uses defaults

var text="QTR202510HALFBPASTOV931106481275O'C";
// Key has row, col, len-1 for  5 x 7 array of
// text above, encoded to base 28, 4, 1.
// [0]...[6] = o'c[lock], 5, 10, qtr, 20, 25, half
// [7]...[18] = 1, 2, 3...12
// [19], [20] = from, to
// See text.xlsx to encode, highlightText() to decode
var key=new Uint8Array([130, 24, 29, 2, 13, 21, 39, 113, 92, 116, 84, 104, 124, 100, 120, 108, 80, 93, 89, 69, 59]);

// popup stuff - also uses widget_utils module
var sc=0; // second counter used to hide popup
var touched=false; // track if we're handling a touch event
var secInterval; // popup timer

function highlightText(v) {
  var t=key[v];
  var r=Math.floor(t/28);
  var c=Math.floor((t-28*r)/4);
  var l=t-28*r-4*c+1; // l stored as 0 to 4 representing len 1 to 5, hence +1
  g.drawString(text.substr(r*7+c,l),c*24,r*37);
}

function doPopup() {
  //g.clearRect(0,24,175,175);  
  var d=new Date();
  g.drawString(d.local().as("0h:0m:0s").str, 0, 30,1);
  g.drawString("Bat " + E.getBattery() +"%",0,70,1);
  g.drawString("Step " + Bangle.getHealthStatus('day').steps,0,110,1);
  if (++sc>5) { // stop after 5 secs
    clearInterval(secInterval);
    require("widget_utils").hide();
    draw();// reshow main
    touched=false;
  }
}

function draw() {
  // update text display with time to nearest 5 mins,
  // changing at 2.5, 7.5... mins past the hour.
  // Returns ms to delay until next update
  g.clear(true);
  g.setColor(faint,faint,faint);    
  g.setFont("Teletext10x18Ascii",2);
  for (let i=0; i<5; i++) {
    g.drawString(text.substr(i*7,7),0,i*37,1);
  }
  g.setColor(g.theme.fg);
  var d=new Date();
  var h=(d.getHours())%12;
  var m=d.getMinutes();
  var s=d.getSeconds();
  var mm=Math.floor((m+s/60+2.5)/5)%12; // original m needed for o'clock shenanigans

  if (mm!==0) { // time is xx past/to the hour
    var toPast=20; // past
    if (mm>6) { // after half past (=6)...
      mm=12-mm; // so count down again,
      h=(h+=1)%12; // advance hour,
      toPast=19; // and show as to
    }
    highlightText(mm); // first seven elements are o'clock, 5, 10, qtr, 20, 25, half
    highlightText(toPast); // to/past are elements 19, 20
    highlightText(h+7);// offset by 7 to get to hour entries 
  } else { // time is o'clock
    if ((m*60+s)>=3450) h=(h+=1)%12; // advance hour if after 57.5 mins
    highlightText(h+7);
    highlightText(mm);
  }
// timeout delay is to multiple of 5 min (300 sec) after
// 2.5 min past current min/sec
  var t=300000-1000*((150+m*60+s)%300);
  return(t);
}

var faint=(g.theme.dark)?0.3:0.5; // maximise contrast
Bangle.loadWidgets();
require("widget_utils").hide();
setTimeout(function () {
  var minuteInterval = setInterval(draw, 300000);
  draw();
}, draw()); // return ms delay before starting loop
Bangle.setUI("clockupdown");

Bangle.on('touch', function(button,e) {
  if (touched) return; // prevent nested touch events
  touched=true;
  g.clear(true);
  require("widget_utils").show();
  g.setFontAlign(-1,-1,0);
  g.setFont("Vector:28");
  g.setColor(g.theme.fg);
  sc=0;
  doPopup();
  secInterval=setInterval(doPopup,1000);
});
