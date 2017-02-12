function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

function TimesheetDb() {
    this.current_year = new Date().getFullYear();
    this.current_month = new Date().getMonth();
    this.current_month_data = {};
    this.allowed_hours_key = "allowed-hours-" + this.current_month + "-" + this.current_year;

    this.load = function(dateStrs, complete) {
        chrome.storage.sync.get(dateStrs, complete);
    }

    this.load_month = function(complete=null) {
        var days = daysInMonth(this.current_month, this.current_year);
        dates = [];

        for (var i = 1; i <= days; i++) {
            dates.push(new Date(this.current_year, this.current_month, i).toString());
        }

        this.load(dates, function(items) {
            if (items && Object.keys(items).length > 0) {
                $.extend(this.current_month_data, items);
            }
            if (complete) {
                complete(items);
            }
        });
    }

    this.update = function(date_map, complete=null) {
        chrome.storage.sync.set(date_map, function() {
            this.load_month(complete);
        }.bind(this));
    }

    this.load_allowed_hours = function(complete=null) {
        chrome.storage.sync.get(this.allowed_hours_key, function(items) {
            if (complete) {
                if (items && this.allowed_hours_key in items) {
                    console.log("Got user allowed hours data from DB: ", items);
                    complete(items[this.allowed_hours_key]);
                } else {
                    console.log("WARNING: Could not retrieve data from the database. Items is either null or invalid: ", items);
                    complete(null);
                }
            }
        }.bind(this))
    }

    this.update_allowed_hours = function(allowed_hours, complete=null) {
        var obj = {};
        obj[this.allowed_hours_key] = allowed_hours;

        chrome.storage.sync.set(obj, function() {
            if (complete) {
                complete();
            }
        }.bind(this))
    }
}