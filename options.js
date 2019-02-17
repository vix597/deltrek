// Saves options to chrome.storage.sync
function save_options() {
    console.debug("Save options");

    var show_hidden = $('#show-hidden').is(':checked');
    var enable_reminders = $('#enable-reminders').is(':checked');

    chrome.storage.sync.set({
        show_hidden: show_hidden,
        enable_reminders: enable_reminders
    }, function() {
        // Update status to let user know options were saved.
        var status = $("#status");
        status.text("Options Saved!");

        setTimeout(function() {
            status.text("");
        }, 750);
    });
}

// Load options from chrome.storage.sync
function restore_options() {
    console.debug("Restore options");

    chrome.storage.sync.get({
        show_hidden: false,
        enable_reminders: false
    }, function(items) {
        console.debug("Options loaded: ", items);

        $("#show-hidden").prop("checked", items.show_hidden);
        $("#enable-reminders").prop("checked", items.enable_reminders);
    });
}

$(document).on('DOMContentLoaded', restore_options);
$('#save').click(save_options);