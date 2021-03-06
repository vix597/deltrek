var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

var g_month_name = monthNames[new Date().getMonth()];
var g_db = new TimesheetDb();
var g_current_month_charges = [];

function htmlEscapeId(str) {
    return str
        .trim()
        .replace(/\s/g, '-')
        .replace(/[^A-Za-z0-9\-]/g, '');
}

function updateHours(event) {
    var allowed_hours = {}

    for (var i = 0; i < g_current_month_charges.length; i++) {
        var key_as_id = htmlEscapeId(g_current_month_charges[i]);
        var hours = parseFloat($("#" + key_as_id).val());
        var percent = parseFloat($("#" + key_as_id + "-percentage").val());
        if (isNaN(percent)) {
            percent = 10;
        }
        if (isNaN(hours)) {
            hours = 0;
        }
        allowed_hours[g_current_month_charges[i]] = {hours:hours, hidden:false, percent:percent};
    }

    $(":checked").each(function(index, item) {
        for (var i = 0; i < g_current_month_charges.length; i++) {
            var key_as_id = htmlEscapeId(g_current_month_charges[i]);
            if ($(item).attr("id") == (key_as_id + "-checkbox")) {
                allowed_hours[g_current_month_charges[i]].hidden = true;
            }
        }
    });

    console.debug("Update hours: ", allowed_hours);

    g_db.update_allowed_hours(allowed_hours, function() {
        refresh();
    });
}

function refresh() {
    // Clear out before refresh
    $("#deltrek").empty();

    g_db.load_month(function(items) {
        if(!items || !Object.keys(items).length) {
            console.debug("Nothing in database yet. Display help");

            $("#deltrek").prepend(
                $("<p>").text(
                    "There is nothing in the Deltrek database yet. Start by logging into deltek and opening a timesheet. " +
                    "Check back here once you've opened a timesheet. If there are any previous timesheets for this month that " +
                    "you would like included in the totals, you will need to manually open each one (without using the navigation arrows " +
                    "within deltek)")
            );
        }

        // Calculate current monthly totals for each charge number
        var charge_to_total = {};
        for (key in items) {
            var charge_array = items[key];
            for (var i = 0; i < charge_array.length; i++) {
                if (!(charge_array[i].title in charge_to_total)) {
                    charge_to_total[charge_array[i].title] = 0;
                }
                charge_to_total[charge_array[i].title] += charge_array[i].value;
            }
        }

        g_current_month_charges = Object.keys(charge_to_total);

        g_db.load_allowed_hours(function(items) {
            // Figure out if we should show hidden charges
            var show_hidden = $("#show-hidden").is(":checked");

            console.debug("Allowed hours: ", items);
            console.debug("Showing hidden? ", show_hidden);

            for (key in charge_to_total) {
                var hours = charge_to_total[key];
                var allowed_hours = 0;
                var percent = 10;
                var hidden = false;
                var key_as_id = htmlEscapeId(key);
                if (items && key in items) {
                    allowed_hours = items[key].hours;
                    hidden = items[key].hidden;
                    percent = items[key].percent;
                }

                // Don't display if it's hidden and we're not showing hidden entries
                var checked;
                if (hidden) {
                    checked = "checked";
                } else {
                    checked = "";
                }

                var display;
                if (hidden && !show_hidden) {
                    display = "style='display:none;'";
                } else {
                    display = "";
                }

                var panelType = '';
                var textColor = '';
                if (!allowed_hours && hours > 0) {
                    panelType = 'bg-danger';
                } else if(allowed_hours > 0) {
                    var current_percent = (hours / allowed_hours) * 100.0;
                    var lower_bound = 100 - percent;
                    var upper_bound = 100 + percent;
                    if (current_percent < lower_bound) {
                        panelType = 'bg-warning';
                    } else if (current_percent > upper_bound) {
                        panelType = 'bg-danger';
                    } else if (current_percent > lower_bound && current_percent < upper_bound) {
                        panelType = 'bg-success';
                    } else if (current_percent == 100) {
                        panelType = 'bg-success';
                    }
                }

                if (panelType.length) {
                    textColor = 'text-white';
                }

                $("#deltrek").prepend(
                    $("<div class='card " + panelType + "' " + display + " >").append(
                        $("<div class='card-header' id='" + key_as_id + "-heading'>").append(
                            $("<h2 class='mb-0'>").append(
                                $("<button class='btn btn-link " + textColor + "' type='button' data-toggle='collapse' data-target='#" + key_as_id + "-collapse' aria-controls='" + key_as_id + "-collapse'>")
                                .text(key + " (Worked: " + hours + "/" + allowed_hours + ")")
                            )
                        )
                    ).append(
                        $("<div id='" + key_as_id + "-collapse' class='collapse' aria-labelledby='" + key_as_id + "-heading' data-parent='#deltrek'>").append(
                            $("<div class='card-body'>").append(
                                $("<label>").html(
                                    "Allowed hours: <input type='number' step='0.5' min='0' id='" + key_as_id + "' value='" + allowed_hours + "'>"
                                )
                            ).append(
                                $("<label>").html(
                                    "Plus/Minus: <input type='number' step='1' min='0' id='" + key_as_id + "-percentage' value='" + percent + "'>%"
                                )
                            ).append(
                                $("<label>").html("&nbsp; Hide this line").prepend($("<input id='" + key_as_id + "-checkbox' type='checkbox' " + checked + " >"))
                            )
                        )
                    )
                );
                // Enable the collapsibles
                $('#' + key_as_id + '-collapse').collapse({toggle: false});
            }
        });
    });
}

$(document).ready(function() {
    $('#save').click(updateHours);

    $("#show-hidden").click(function() {
        refresh();
    });

    $("#month-title").text("Hours for " + g_month_name);

    // Don't show the 'Go to Deltek' link if we're on the Deltek page
    chrome.tabs.query({
        active: true,
        url: "*://*.deltekenterprise.com/*"
    }, function(result) {
        console.debug("Matching tabs: ", result);

        if (result && result.length) {
            console.debug("We're on the deltek page, don't show 'Go to Deltek' link");
            $("#go-to-deltek").hide();
        }
    });

    chrome.storage.sync.get({
        deltek_link: ""
    }, function(items) {
        console.debug("Content page options loaded: ", items);
        if (items.deltek_link && items.deltek_link.length) {
            console.debug("Setting deltek link: ", items.deltek_link);
            $("#go-to-deltek-link").attr("href", items.deltek_link);
        } else {
            $("#go-to-deltek").hide();
        }
    });

    refresh();
});