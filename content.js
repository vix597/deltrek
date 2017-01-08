
function parseTimesheet(appBody) {
    var d = new Date();
    var year = d.getFullYear();
    var timesheet = [];

    console.log("Getting charge numbers...");
    appBody.find("#udtColumn0").children().each(function(index, item) {
        var title = $(item).attr("title");
        if (title) {
            timesheet.push({title:title, hours:[]});
        }
    });

    console.log("Getting dates...");
    appBody.find("#hrsHeader").children().each(function(index, item) {
        for (var i = 0; i < timesheet.length; i++) {
            var dateStr = $(item).text().slice(3);
            if (dateStr.length >= 3) {
                var datePrts = dateStr.split("/");
                if (datePrts.length == 2) {
                    // Subtract one from month b/c index @ 0
                    var date = new Date(year, (parseInt(datePrts[0]) - 1), parseInt(datePrts[1]));
                    timesheet[i].hours.push({date:date, value:0});
                } else {
                    console.log("ERROR: Invalid date: ", dateStr);
                }
            }
        }
    });

    console.log("Getting hours...");
    for (var i = 0; i < timesheet.length; i++) {
        for (var j = 0; j < timesheet[i].hours.length; j++) {
            var id = "#hrs" + i + "_" + j;
            var hours = appBody.find(id).text();
            hours = parseInt(hours);
            if (isNaN(hours)) {
                hours = 0;
            }
            timesheet[i].hours[j].value = hours;
        }
    }
    return timesheet;
}

$(document).ready(function() {
    console.log("Deltrek Activated. On Deltek page.");
    
    $("#unitFrame").on("load", function(){
        console.log("Iframe loaded. Scanning for timesheet application...");
        appBody = $("#unitFrame").contents().find("body");
        
        if (appBody.find("#appTitle").text() == "Timesheet") {
            console.log("Timesheet found!");
            ts = parseTimesheet(appBody);
            console.log("Parsed: ", ts);
        } else {
            console.log("Not on timesheet page. App title: ", appBody.find("#appTitle").text());
        }
    });
});