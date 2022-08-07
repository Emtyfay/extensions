const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;

let dateMenu = null;
let settings = null;
let fuzzyClock = null;
let updateClockId = 0;

function FuzzyClock() {
    this.init();
}

FuzzyClock.prototype = {
    init: function() {
        this.hour_fmt = [
            "%0 o'Clock", "Five past %0", "Ten past %0", "Quarter past %0",
            "Twenty past %0", "Twenty Five past %0", "Half past %0",
            "Twenty Five to %1", "Twenty to %1", "Quarter to %1", "Ten to %1",
            "Five to %1", "%1 o'Clock"
        ];
        this.hour_names = [
            "Twelve", "One", "Two", "Three", "Four", "Five", "Six",
            "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"
        ];
        this.month_fmt = [
            "Beginning of %0", "Early %0", "Middle of %0", "Late %0", "End of %0"
        ];
        this.month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
    },

    time: function(now) {
        let hours = now.get_hour();
        return this.hour_fmt[Math.round(now.get_minute() / 5)]
            .replace("%0", this.hour_names[hours >= 12 ? hours - 12 : hours])
            .replace("%1", this.hour_names[hours +1 >= 12 ? hours +1 -12 : hours +1]) ;
    },

    date: function(now) {
        let month = now.get_month();
        let day = now.get_day_of_month();
        let days = GLib.Date.get_days_in_month(month, now.get_year());
        return this.month_fmt[Math.round(4 * (day / days))]
            .replace("%0", this.month_names[month - 1]);
    }
};

function updateClockAndDate() {
    let tz = dateMenu._clock.get_timezone();
    let now = GLib.DateTime.new_now(tz);
    let clockStr = fuzzyClock.time(now);
    if (settings.get_boolean('clock-show-date')) {
        let dateStr = fuzzyClock.date(now);
        dateMenu._date.label = dateStr;
        clockStr += ", " + dateStr;
    }
    dateMenu._clockDisplay.text = clockStr;
}

function init() {}

function enable() {
    dateMenu = Main.panel.statusArea['dateMenu'];
    if (!dateMenu) {
        return;
    }
    settings = new Gio.Settings({ schema: 'org.gnome.desktop.interface' });
    fuzzyClock = new FuzzyClock();
    if (updateClockId !== 0) {
        dateMenu._clock.disconnect(updateClockId);
    }
    updateClockId = dateMenu._clock.connect('notify::clock', updateClockAndDate.bind(dateMenu));
    updateClockAndDate();
}

function disable() {
    if (!dateMenu) {
        return;
    }
    if (updateClockId !== 0) {
        dateMenu._clock.disconnect(updateClockId);
        updateClockId = 0;
    }
    dateMenu._clockDisplay.text = dateMenu._clock.clock;
    delete fuzzyClock;
    fuzzyClock = null;
    delete settings;
    settings = null;
    dateMenu = null;
}
