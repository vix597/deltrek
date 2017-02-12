
function SettingsDb() {
    this.key = "settings-key";

    this.load = function(complete=null) {
        chrome.storage.sync.get(this.key, function(items) {
            if (complete) {
                complete(items);
            }
        }.bind(this));
    }

    this.set = function(settings, complete=null) {
        var obj = {};
        obj[this.key] = settings;

        chrome.storage.sync.set(obj, function() {
            if (complete) {
                complete();
            }
        }.bind(this));
    }
}