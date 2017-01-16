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

    this.update = function(date_map) {
        chrome.storage.sync.set(date_map);
    }
}

function dateFromString(dateStr) {
    var d = new Date();
    var year = d.getFullYear();
    var dateStr = dateStr.slice(3);
    
    if (dateStr.length >= 3) {
        var datePrts = dateStr.split("/");
        if (datePrts.length == 2) {
            // Subtract one from month b/c indexed at 0
            return new Date(year, (parseInt(datePrts[0]) - 1), parseInt(datePrts[1]));
        } else {
            return null;
        }
    } else {
        return null;
    }
}

function parseTimesheet(appBody) {
    var timesheet = [];

    console.log("Getting charge numbers...");
    appBody.find("#udtColumn0").children().each(function(index, item) {
        var title = $(item).attr("title");
        var charge_number = appBody.find("#udt" + index + "_1").text();
        if (title && charge_number) {
            timesheet.push({title:title, charge_number:charge_number, hours:[]});
        }
    });

    console.log("Getting dates...");
    appBody.find("#hrsHeader").children().each(function(index, item) {
        for (var i = 0; i < timesheet.length; i++) {
            var date = dateFromString($(item).text());
            if (date) {
                timesheet[i].hours.push({date:date, value:0});
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

    console.log("Converting...");
    date_map_timesheet = {};
    for (var i = 0; i < timesheet.length; i++) {
        var charge_str = timesheet[i].title;
        var charge_number = timesheet[i].charge_number;
        for (var j = 0; j < timesheet[i].hours.length; j++) {
            var key = timesheet[i].hours[j].date.toString();

            if (!(key in date_map_timesheet)) {
                date_map_timesheet[key] = [];
            }

            date_map_timesheet[key].push({
                title: charge_str,
                charge_number:charge_number,
                value: timesheet[i].hours[j].value
            });
        }
    }

    return date_map_timesheet;
}

function setTimesheetChangeHook(appBody, db) {
    console.log("Setting timesheet change hooks...");

    appBody.find("#editor").on("blur", function(event) {
        var parent = event.currentTarget.parentNode;
        var id = $(parent).attr("id");

        if (id && id.startsWith("hrs")) {            
            var hours = parseFloat($(this).val());
            if (isNaN(hours)) {
                hours = 0.0;
            }

            ts = parseTimesheet(appBody);

            var row_col_str = id.slice(3);
            var row_col = row_col_str.split("_");
            var col = 0;
            var row = 0;
            var date = null;

            if (row_col.length != 2) {
                console.log("ERROR: Could not get column for current hours entry");
                return;
            } else {
                row = row_col[0];
                col = row_col[1];
            }
            
            var dateStr = appBody.find("#hrsHeaderText"+col).text();

            date = dateFromString(dateStr);
            
            if (date) {
                ts[date][row].value = hours;
                console.log("Updated TS: ", ts);
                db.update(ts);
            }
        }
    });
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

            setTimesheetChangeHook(appBody, db);            
        } else {
            console.log("Not on timesheet page. App title: ", appBody.find("#appTitle").text());
        }
    });
});