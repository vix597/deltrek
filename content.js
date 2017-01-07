function parseTimesheet(appBody) {
    
}

$(document).ready(function() {
    console.log("Deltrek Activated. On Deltek page.");
    
    $("#unitFrame").on("load", function(){
        console.log("Iframe loaded. Scanning for timesheet application...");
        appBody = $("#unitFrame").contents().find("body");
        
        if (appBody.find("#appTitle").text() == "Timesheet") {
            console.log("Timesheet found!");
            parseTimesheet(appBody);
        } else {
            console.log("Not on timesheet page. App title: ", appBody.find("#appTitle").text());
        }
    });
});