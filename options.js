// Saves options to chrome.storage.sync
function save_options() {
    console.debug("Save options");

    var show_hidden = $('#show-hidden').is(':checked');
    var enable_reminders = $('#enable-reminders').is(':checked');
    var login_domain = $('#login-domain').val();
    var deltek_link = $('#deltek-link').val();

    console.debug("Saving options:");
    console.debug("Show hidden? ", show_hidden);
    console.debug("Enable reminders? ", enable_reminders);
    console.debug("Login domain: ", login_domain);
    console.debug("Deltek Link: ", deltek_link);

    chrome.storage.sync.set({
        show_hidden: show_hidden,
        enable_reminders: enable_reminders,
        login_domain: login_domain,
        deltek_link: deltek_link
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
        enable_reminders: false,
        login_domain: "",
        deltek_link: ""
    }, function(items) {
        console.debug("Options loaded: ", items);

        $("#show-hidden").prop("checked", items.show_hidden);
        $("#enable-reminders").prop("checked", items.enable_reminders);
        $("#login-domain").val(items.login_domain);
        $("#deltek-link").val(items.deltek_link);
    });
}

$(document).on('DOMContentLoaded', restore_options);
$('#save').click(save_options);