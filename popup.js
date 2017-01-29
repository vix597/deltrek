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
        .replace(/&/g, '')
        .replace(/"/g, '')
        .replace(/'/g, '')
        .replace(/</g, '')
        .replace(/>/g, '');
}

function updateHours(event) {
    var allowed_hours = {}

    for (var i = 0; i < g_current_month_charges.length; i++) {
        var key_as_id = g_current_month_charges[i].trim().replace(/\s/g, '');
        var hours = parseFloat($("#" + key_as_id).val());
        if (isNaN(hours)) {
            hours = 0;
        }
        allowed_hours[g_current_month_charges[i]] = hours;
    }

    console.log("Update hours: ", allowed_hours);

    g_db.update_allowed_hours(allowed_hours);
}

function hideCharge(event) {
    console.log("Hide charge: ", event);
}

$(document).ready(function() { 
    $('#save').click(updateHours);

    g_db.load_month(function(items) {
        $("#month-title").text("Hours for " + g_month_name);

        // Calculate current monthly total
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
            console.log("Allowed hours: ", items);

            for (key in charge_to_total) {
                var hours = charge_to_total[key];
                var allowed_hours = 0;
                var key_as_id = htmlEscapeId(key);
                if (items && key in items) {
                    allowed_hours = items[key];
                }

                // TODO: Determine this based on how close they are to going over
                panelType = "panel-default";

                $("#deltrek").prepend(
                    $("<div class='panel " + panelType + "'>").append(
                        $("<div class='panel-heading' role='tab' id='" + key_as_id + "-heading'>").append(
                            $("<h4 class='panel-title'>").append(
                                $("<a role='button' data-toggle='collapse' data-parent='#deltrek' href='#" + key_as_id + "-collapse' aria-expanded='true' aria-controls='" + key_as_id + "-collapse'>")
                                .text(key + " (Worked: " + hours + "/" + allowed_hours + ")")
                            )
                        )
                    ).append(
                        $("<div id='" + key_as_id + "-collapse' class='panel-collapse collapse' role='tabpanel' aria-labelledby='" + key_as_id + "-heading'>").append(
                            $("<div class='panel-body'>").append(
                                $("<label>").html(
                                    "Allowed hours: <input type='number' step='0.5' min='0' id='" + key_as_id + "'>"
                                )
                            ).append(
                                $("<label>").html(
                                    "Plus/Minus: <input type='number' step='1' min='0' id='" + key_as_id + "-percentage'>%"
                                )
                            ).append(
                                $("<label>").html("&nbsp; Hide this line").prepend($("<input type='checkbox'>"))
                            )
                        )
                    )
                );
            }
        });
    });
});