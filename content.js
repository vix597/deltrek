
function TimesheetDb() {
    this.month = 0;
    this.month_data = null;

    this.load = function(date) {
        var ret = null;

        chrome.storage.sync.get(date.toString(), function(item) {
            console.log("Got item: ", item);
            ret = item;
        });

        return item;
    }

    this.load_month = function(month) {
        
    }

    this.update = function(date_map_timesheet) {
        chrome.storage.sync.set(date_map_timesheet);
    }
}

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
                    // Subtract one from month b/c indexed at 0
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
            hours = parseFloat(hours);
            if (isNaN(hours)) {
                hours = 0;
            }
            timesheet[i].hours[j].value = hours;
        }
    }

    console.log("Converting so date is key...");
    date_map_timesheet = {};
    for (var i = 0; i < timesheet.length; i++) {
        var charge_str = timesheet[i].title;
        for (var j = 0; j < timesheet[i].hours.length; j++) {
            var key = timesheet[i].hours[j].date.toString();

            if (!(key in date_map_timesheet)) {
                date_map_timesheet[key] = [];
            }

            date_map_timesheet[key].push({
                title: charge_str,
                value: timesheet[i].hours[j].value
            });
        }
    }

    return date_map_timesheet;
}

$(document).ready(function() {
    console.log("Deltrek Activated. On Deltek page.");
    
    var db = new TimesheetDb();

    $("#unitFrame").on("load", function(){
        console.log("Iframe loaded. Scanning for timesheet application...");
        appBody = $("#unitFrame").contents().find("body");
        
        if (appBody.find("#appTitle").text() == "Timesheet") {
            console.log("Timesheet found!");
            ts = parseTimesheet(appBody);
            console.log("Parsed: ", ts);
            db.update(ts);
        } else {
            console.log("Not on timesheet page. App title: ", appBody.find("#appTitle").text());
        }
    });
});