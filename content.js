var g_db = new TimesheetDb();

function dateFromString(dateStr) {
    var d = new Date();
    var dateStr = dateStr.slice(3);

    if (dateStr.length >= 3) {
        var datePrts = dateStr.split("/");
        if (datePrts.length == 2) {
            // Subtract one from month b/c indexed at 0
            return new Date(g_db.current_year, (parseInt(datePrts[0]) - 1), parseInt(datePrts[1]));
        } else {
            return null;
        }
    } else {
        return null;
    }
}

function parseTimesheet(appBody) {
    var timesheet = [];

    appBody.find("#udtColumn0").children().each(function(index, item) {
        var title = $(item).attr("title");
        var charge_number = appBody.find("#udt" + index + "_1").text();
        if (title && charge_number) {
            timesheet.push({title:title, charge_number:charge_number, hours:[]});
        }
    });

    appBody.find("#hrsHeader").children().each(function(index, item) {
        for (var i = 0; i < timesheet.length; i++) {
            var date = dateFromString($(item).text());
            if (date) {
                timesheet[i].hours.push({date:date, value:0});
            }
        }
    });

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

function setTimesheetChangeHook(appBody) {

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
                g_db.update(ts, function(items) {
                    console.log("DB Items: ", items);
                });
            }
        }
    });
}

$(document).ready(function() {
    console.log("Deltrek Activated. On Deltek page.");

    $("#unitFrame").on("load", function(){
        console.log("Iframe loaded. Scanning for timesheet application...");
        var appBody = $("#unitFrame").contents().find("body");

        if (appBody.find("#appTitle").text() == "Timesheet") {
            console.log("Timesheet found!");

            ts = parseTimesheet(appBody);
            console.log("Parsed: ", ts);
            g_db.update(ts);

            setTimesheetChangeHook(appBody);
        } else {
            console.log("Not on timesheet page. App title: ", appBody.find("#appTitle").text());
        }
    });
});