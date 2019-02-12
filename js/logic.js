var submit = d3.select("#filter-btn");
var map, layers, Magselect, Timeselect, url //universals 

//initialize basemap
var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.light",
  accessToken: API_KEY
});

//define data source
function pulldata(){
    //pull variables from dropdowns
    Magselect = document.getElementById('Magselect').value;
    Timeselect = document.getElementById('Timeselect').value;
    //console.log(Magselect, Timeselect) //check contents
    url ="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/" + Magselect + "_" + Timeselect + ".geojson";
    //console.log(url);
}

//console.log(url);  //check composite url

function initmap(){
    pulldata();
    //pull data, extract features
    d3.json(url, function(data){
        //send features for processing
        //console.log("extract", data.features) //check feature output
        DrawMap(data.features);
    });

    var projection = d3.geoMercator() //Mercator, okay, I guess
    var path = d3.geoPath().projection(projection);

    // Initialize LayerGroups 
    layers = {
        R1: new L.LayerGroup(),
        R2: new L.LayerGroup(),
        R3: new L.LayerGroup(),
        R4: new L.LayerGroup(),
        R5: new L.LayerGroup(),
        R6: new L.LayerGroup(),
        R7: new L.LayerGroup(),
        R8: new L.LayerGroup(),
        R9: new L.LayerGroup(),
    };

    //initialize map with layers based on magnitude
    map = L.map("map-id", {
        center: [0,0],
        zoom: 2,
        layers: [
        layers.R1,
        layers.R2,
        layers.R3,
        layers.R4,
        layers.R5,
        layers.R6,
        layers.R7,
        layers.R8,
        layers.R9
        ]
    });

    //add basemap
    lightmap.addTo(map);

    //initialize overlays
    var overlays = {
        "R1": layers.R1,
        "R2": layers.R2,
        "R3": layers.R3,
        "R4": layers.R4,
        "R5": layers.R5,
        "R6": layers.R6,
        "R7": layers.R7,
        "R8": layers.R8,
        "R9": layers.R9
    };
    
    // Create layer control
    L.control.layers(null, overlays).addTo(map);
    
    // Create legend
    var info = L.control({
        position: "bottomright"
    });

    // add legend div
    info.onAdd = function() {
        var div = L.DomUtil.create("div", "legend");
        return div;
    };

    // Add the info legend to the map
    info.addTo(map);
};


function DrawMap(QuakeData) {
    //console.log("QuakeData", QuakeData); //check data
    //console.log("Features", QuakeData.length);  //check number of results

    //initialize quakecount
    var QuakeCount = {
        R1: 0,
        R2: 0,
        R3: 0,
        R4: 0,
        R5: 0,
        R6: 0,
        R7: 0,
        R8: 0,
        R9: 0
    };
    
    //Loop through all returned quake features
    for (var i = 0; i < QuakeData.length; i++) {
        var currenttime = new Date();
        var eventtime = new Date(QuakeData[i].properties.time);
        var timepassed = daysBetween(currenttime, eventtime)
         
        //find number of days that have passed since the earthquake occured
        function daysBetween ( date1, date2 ) {
            //Get 1 day in milliseconds
            var one_day=1000*60*60*24;
          
            // Convert both dates to milliseconds
            var date1_ms = date1.getTime();
            var date2_ms = date2.getTime();
          
            // Calculate the difference in milliseconds
            var difference_ms = date2_ms - date1_ms;
              
            // Convert back to days and return
            return Math.abs(Math.round(difference_ms/one_day)); 
        }

        var HUE,SAT,LIGHT,mag,Size; //initialize dynamic settings

        //Bin quakes by magnitude
        if (QuakeData[i].properties.mag > 9) {
            mag = 9;
        }
        else if (QuakeData[i].properties.mag > 8) {
            mag = 8;
        }
        else if (QuakeData[i].properties.mag > 7) {
            mag = 7;
        }
        else if (QuakeData[i].properties.mag > 6) {
            mag = 6;
        }
        else if (QuakeData[i].properties.mag > 5) {
            mag = 5;
        }
        else if (QuakeData[i].properties.mag > 4) {
            mag = 4;
        }
        else if (QuakeData[i].properties.mag > 3) {
            mag = 3;
        }
        else if (QuakeData[i].properties.mag > 2) {
            mag = 2;
        }
        else {
            mag = 1;
        }

        QuakeCount["R" + mag]++; //itterate appropriate count value

        MS = QuakeData[i].properties.mag; //set Size according to magnitude
        Size = (MS*MS)-(2*MS)+10; //normalize the magnitude disparity a little, range reduced from 0-81 to 10-73 
        HUE = timepassed*2; //set Hue based on # of days passed, range: 0 - 60 (Red to yellow-green)
        SAT = (100 - (timepassed * 2)); //set saturation based on number of days passed, range 100 - 40 (older = more faded)
        LIGHT = (75 - (mag * 5));  //set lightness based on magnitude, range 75 - 30 (Stronger = Darker) 
        Markcolor = hslToHex(HUE,SAT,LIGHT)  //pass hsl int hex converter 
        //console.log(HUE,SAT,LIGHT, Size, Markcolor); //check all dynamic values

        var Anchorpoint = [Size/2, Size];

        var newMarker = L.marker([QuakeData[i].geometry.coordinates[1], QuakeData[i].geometry.coordinates[0]], {
            //icon color itself cannot change dynamically because source cisons are a static categorical *.png
            opacity: (.5+(mag*.05)) //so bind magnitude to opacity, range 55% - 95% (more opaque = stronger earthquake)
        });

    //Bind Icon settings to Dynamic values
    var icon = newMarker.options.icon;
        icon.options.iconSize = Size;
        icon.options.iconColor = Markcolor; //While not returning an error, this option does not change icon color, bound to opacity instead
        icon.options.iconAnchor = Anchorpoint; //make sure point points to location & minimize zoom drift
        icon.options.shadowSize = [0,0]; //icon shadows are annoying


        //console.log(icon.options.iconColor);  //check color settings
        newMarker.setIcon(icon);

          // Add the new marker to the appropriate layer
        newMarker.addTo(layers["R"+mag]);
    
          // Bind a popup to the marker that will  display on click. This will be rendered as HTML
        newMarker.bindPopup(QuakeData[i].properties.title 
            + "<br>Lat: "
            + QuakeData[i].geometry.coordinates[1] 
            + "<br>Long: "
            + QuakeData[i].geometry.coordinates[0]
            + "<br>Depth: "
            + QuakeData[i].geometry.coordinates[2]
            + "<br>Time: " 
            + new Date(QuakeData[i].properties.time) 
        );
        
    }

    updateLegend(currenttime, QuakeCount);
};

//update legend title & numbers
function updateLegend(time, QuakeCount) {
    document.querySelector(".legend").innerHTML = [
      "<p>Updated: " + moment.unix(time).format("h:mm:ss A" +" UTC</p>") + "Showing " + Magselect + " earthquakes<br>from previous " + Timeselect + "<p>Richter Scale:<br>",
      "<table><td><p class='R1'>R1: " + QuakeCount.R1 + "</p>",
      "<p class='R2'>R2: " + QuakeCount.R2 + "</p>",
      "<p class='R3'>R3: " + QuakeCount.R3 + "</p>",
      "<p class='R4'>R4: " + QuakeCount.R4 + "</p>",
      "<p class='R5'>R5: " + QuakeCount.R5 + "</p></td>",
      "<td><p class='R6'>R6: " + QuakeCount.R6 + "</p>",
      "<p class='R7'>R7: " + QuakeCount.R7 + "</p>",
      "<p class='R8'>R8: " + QuakeCount.R8 + "</p>",
      "<p class='R9'>R9: " + QuakeCount.R9 + "</p></td></table>"
    ].join("");
}


//color converter
function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

//listener to update map based on new selection
submit.on("click", function() {
    d3.event.preventDefault();
  
    //clear the map
    d3.select("map-id").html("");
    map.remove();

    //rebuild the map
    initmap();
 });

 //initialize map
initmap();