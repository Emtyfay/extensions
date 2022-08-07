const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Adw, Gdk, GdkPixbuf, Gio, GLib, GObject, Gtk} = imports.gi;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function init() {
    ExtensionUtils.initTranslations();
}

function fillPreferencesWindow(window) {
    let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
    if(!iconTheme.get_search_path().includes(Me.path + "/media"))
        iconTheme.add_search_path(Me.path + "/media");

    const settings = ExtensionUtils.getSettings();

    window.set_search_enabled(true);

    const generalPage = new GeneralPage(settings);
    window.add(generalPage);

    const aboutPage = new AboutPage();
    window.add(aboutPage);
}

var GeneralPage = GObject.registerClass(
class azClock_GeneralPage extends Adw.PreferencesPage {
    _init(settings) {
        super._init({
            title: _("Settings"),
            icon_name: 'preferences-system-symbolic',
            name: 'GeneralPage'
        });

        this._settings = settings;

        let generalGroup = new Adw.PreferencesGroup({
            title: _("General Options")
        });
        this.add(generalGroup);

        let labelOrders = new Gtk.StringList();
        labelOrders.append(_("Time - Date"));
        labelOrders.append(_("Date - Time"));
        let labelOrderRow = new Adw.ComboRow({
            title: _("Label Order"),
            model: labelOrders,
            selected: this._settings.get_enum('time-date-order')
        });
        labelOrderRow.connect("notify::selected", (widget) => {
            this._settings.set_enum('time-date-order', widget.selected);
        });
        generalGroup.add(labelOrderRow);

        let inlineSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        let inlineRow = new Adw.ActionRow({
            title: _("Display In-Line"),
            activatable_widget: inlineSwitch
        });
        inlineSwitch.set_active(this._settings.get_boolean('time-date-inline'));
        inlineSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('time-date-inline', widget.get_active());
        });
        inlineRow.add_suffix(inlineSwitch);
        generalGroup.add(inlineRow);

        let dateFormatEntry = new Gtk.Entry({
            valign: Gtk.Align.CENTER,
            width_chars: 20,
            text: this._settings.get_string('date-format')
        });
        dateFormatEntry.connect('changed',() => {
            this._settings.set_string('date-format', dateFormatEntry.get_text());
        });
        let dateFormatRow = new Adw.ActionRow({
            title: _("Date Format"),
            activatable_widget: dateFormatEntry,
        });

        let linkButton = new Gtk.LinkButton({
            label: _("Format Guide"),
            uri: 'https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes',
        });

        dateFormatRow.add_suffix(linkButton);
        dateFormatRow.add_suffix(dateFormatEntry);
        generalGroup.add(dateFormatRow);

        let [borderEnabled, borderWidth, borderRadius, borderColor] = this._settings.get_value('widget-border').deep_unpack();
        let borderOptionsRow = new Adw.ExpanderRow({
            title: _("Enable Border"),
            show_enable_switch: true,
            expanded: borderEnabled,
            enable_expansion: borderEnabled
        });
        generalGroup.add(borderOptionsRow);
        borderOptionsRow.connect("notify::enable-expansion", (widget) => {
            let settingArray = this._settings.get_value('widget-border').deep_unpack();
            settingArray[0] = widget.enable_expansion;
            this._settings.set_value('widget-border', new GLib.Variant('(biis)', settingArray));
        });

        let borderWidthRow = this.createSpinRow(_("Border Width"), borderWidth, 0, 15, 'widget-border', 1, '(biis)');
        borderOptionsRow.add_row(borderWidthRow);
        let borderRadiusRow = this.createSpinRow(_("Border Radius"), borderRadius, 0, 99, 'widget-border', 2, '(biis)');
        borderOptionsRow.add_row(borderRadiusRow);
        let borderColorRow = this.createColorRow(_("Border Color"), borderColor, 'widget-border', 3, '(biis)');
        borderOptionsRow.add_row(borderColorRow);

        let [backgroundEnabled, backgroundColor] = this._settings.get_value('widget-background').deep_unpack();
        let widgetBackgroundRow = new Adw.ExpanderRow({
            title: _("Enable Background"),
            show_enable_switch: true,
            expanded: backgroundEnabled,
            enable_expansion: backgroundEnabled
        });
        generalGroup.add(widgetBackgroundRow);

        widgetBackgroundRow.connect("notify::enable-expansion", (widget) => {
            let settingArray = this._settings.get_value('widget-background').deep_unpack();
            settingArray[0] = widget.enable_expansion;
            this._settings.set_value('widget-background', new GLib.Variant('(bs)', settingArray));
        });

        let widgetBackgroundColorRow = this.createColorRow(_("Background Color"), backgroundColor, 'widget-background', 1, '(bs)');
        widgetBackgroundRow.add_row(widgetBackgroundColorRow);
    
        let textOptionsGroup = new Adw.PreferencesGroup({
            title: _("Text Style")
        });
        this.add(textOptionsGroup);

        let textColor = this._settings.get_string('text-color');
        let textColorRow = this.createColorRow(_("Text Color"), textColor, 'text-color');
        textOptionsGroup.add(textColorRow);
        let timeFontSizeRow = this.createSpinRow(_("Time Font Size"), this._settings.get_int('time-font-size'), 8, 200, 'time-font-size');
        textOptionsGroup.add(timeFontSizeRow);
        let dateFontSizeRow = this.createSpinRow(_("Date Font Size"), this._settings.get_int('date-font-size'), 8, 200, 'date-font-size');
        textOptionsGroup.add(dateFontSizeRow);

        let [xOffset, yOffset, spread, shadowColor] = this._settings.get_value('text-shadow').deep_unpack();

        let shadowColorRow = this.createColorRow(_("Shadow Color"), shadowColor, 'text-shadow', 3, '(iiis)');
        textOptionsGroup.add(shadowColorRow);
        let xOffsetRow = this.createSpinRow(_("Shadow X Offset"), xOffset, 0, 15, 'text-shadow', 0, '(iiis)');
        textOptionsGroup.add(xOffsetRow);
        let yOffsetRow = this.createSpinRow(_("Shadow Y Offset"), yOffset, 0, 15, 'text-shadow', 1, '(iiis)');
        textOptionsGroup.add(yOffsetRow);
        let spreadRow = this.createSpinRow(_("Shadow Spread"), spread, 0, 15, 'text-shadow', 2, '(iiis)');
        textOptionsGroup.add(spreadRow);

        let buttonGroup = new Adw.PreferencesGroup({
            title: _("Reset Desktop Clock Settings")
        });
        let buttonRow = new Adw.ActionRow();
        let resetSettingsButton = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER,
            hexpand: false,
            label: _("Reset all Settings"),
        });
        let context = resetSettingsButton.get_style_context();
        context.add_class('destructive-action');
        resetSettingsButton.connect('clicked', (widget) => {
            let dialog = new Gtk.MessageDialog({
                text: "<b>" + _("Reset all settings?") + '</b>',
                secondary_text: _("All Desktop Clock settings will be reset to the default value."),
                use_markup: true,
                buttons: Gtk.ButtonsType.YES_NO,
                message_type: Gtk.MessageType.WARNING,
                transient_for: this.get_root(),
                modal: true
            });
            dialog.connect('response', (widget, response) => {
                if(response == Gtk.ResponseType.YES){
                    GLib.spawn_command_line_sync('dconf reset -f /org/gnome/shell/extensions/azclock/');
                    restoreDefaults();
                }
                dialog.destroy();
            });
            dialog.show();
        });
        let resetPositionButton = new Gtk.Button({
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER,
            hexpand: false,
            label: _("Reset Clock Position"),
        });
        context = resetPositionButton.get_style_context();
        context.add_class('destructive-action');
        resetPositionButton.connect('clicked', (widget) => {
            let dialog = new Gtk.MessageDialog({
                text: "<b>" + _("Reset Clock Position?") + '</b>',
                secondary_text: _("Please confirm reset of clock position."),
                use_markup: true,
                buttons: Gtk.ButtonsType.YES_NO,
                message_type: Gtk.MessageType.WARNING,
                transient_for: this.get_root(),
                modal: true
            });
            dialog.connect('response', (widget, response) => {
                if(response == Gtk.ResponseType.YES){
                    GLib.spawn_command_line_sync('dconf reset /org/gnome/shell/extensions/azclock/clock-location');
                }
                dialog.destroy();
            });
            dialog.show();
        });
        buttonRow.add_suffix(resetSettingsButton);
        buttonRow.add_prefix(resetPositionButton);
        buttonGroup.add(buttonRow);
        this.add(buttonGroup);

        let restoreDefaults = () => {
            let [borderEnabled, borderWidth, borderRadius, borderColor] = this._settings.get_default_value('widget-border').deep_unpack();
            borderOptionsRow.enable_expansion = borderEnabled
            borderWidthRow.setValue(borderWidth);
            borderRadiusRow.setValue(borderRadius);
            borderColorRow.setValue(borderColor);

            let [backgroundEnabled, backgroundColor] = this._settings.get_default_value('widget-background').deep_unpack();
            widgetBackgroundRow.enable_expansion = backgroundEnabled
            widgetBackgroundColorRow.setValue(backgroundColor);

            let [xOffset, yOffset, spread, shadowColor] = this._settings.get_default_value('text-shadow').deep_unpack();
            let textColor = this._settings.get_string('text-color');
            xOffsetRow.setValue(xOffset);
            yOffsetRow.setValue(yOffset);
            spreadRow.setValue(spread);
            shadowColorRow.setValue(shadowColor);
            textColorRow.setValue(textColor);
            dateFontSizeRow.setValue(this._settings.get_default_value('date-font-size').deep_unpack());
            timeFontSizeRow.setValue(this._settings.get_default_value('time-font-size').deep_unpack());
            inlineSwitch.set_active(this._settings.get_default_value('time-date-inline').deep_unpack());
            labelOrderRow.selected = this._settings.get_default_value('time-date-order').deep_unpack();
            dateFormatEntry.set_text(this._settings.get_default_value('date-format').deep_unpack());
        }
    }

    createSpinRow(title, value, lower, upper, setting, settingIndex, variantType){
        let spinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower, upper, step_increment: 1, page_increment: 1, page_size: 0,
            }),
            climb_rate: 1,
            digits: 0,
            numeric: true,
            valign: Gtk.Align.CENTER,
        });
        spinButton.set_value(value);
        spinButton.connect('value-changed', (widget) => {
            if(settingIndex !== undefined){
                let settingArray = this._settings.get_value(setting).deep_unpack();
                settingArray[settingIndex] = widget.get_value();
                this._settings.set_value(setting, new GLib.Variant(variantType, settingArray));
            }
            else{
                this._settings.set_int(setting, widget.get_value());
            }
        });
        let spinRow = new Adw.ActionRow({
            title: _(title),
            activatable_widget: spinButton
        });

        spinRow.setValue = (value) => {
            spinButton.set_value(value);
        }

        spinRow.add_suffix(spinButton);
        return spinRow;
    }

    createColorRow(title, color, setting, settingIndex, variantType){
        let rgba = new Gdk.RGBA();
        rgba.parse(color);
        let colorButton = new Gtk.ColorButton({
            rgba,
            use_alpha: true,
            valign: Gtk.Align.CENTER
        });
        colorButton.connect('color-set', (widget) => {
            if(settingIndex !== undefined){
                let settingArray = this._settings.get_value(setting).deep_unpack();
                settingArray[settingIndex] = widget.get_rgba().to_string();
                this._settings.set_value(setting, new GLib.Variant(variantType, settingArray));
            }
            else{
                this._settings.set_string(setting, widget.get_rgba().to_string());
            }
        });
        let colorRow = new Adw.ActionRow({
            title: _(title),
            activatable_widget: colorButton
        });
        colorRow.add_suffix(colorButton);

        colorRow.setValue = (value) => {
            rgba = new Gdk.RGBA();
            rgba.parse(value);
            colorButton.set_rgba(rgba);
        }
        return colorRow;
    }
});

var AboutPage = GObject.registerClass(
class azClock_AboutPage extends Adw.PreferencesPage {
    _init() {
        super._init({
            title: _("About"),
            icon_name: 'help-about-symbolic',
            name: 'AboutPage'
        });

        //Logo and project description-------------------------------------
        let azClockLogoGroup = new Adw.PreferencesGroup();
        let azClockImage = new Gtk.Image({
            margin_bottom: 5,
            icon_name: 'azclock-logo',
            pixel_size: 100,
        });
        let azClockImageBox = new Gtk.Box( {
            orientation: Gtk.Orientation.VERTICAL,
            hexpand: false,
            vexpand: false
        });
        azClockImageBox.append(azClockImage);
        let azClockLabel = new Gtk.Label({
            label: '<span size="larger"><b>' + _('Desktop Clock') + '</b></span>',
            use_markup: true,
            vexpand: true,
            valign: Gtk.Align.FILL
        });
        let projectDescriptionLabel = new Gtk.Label({
            label: _('Add a clock to the desktop!'),
            hexpand: false,
            vexpand: false,
        });
        azClockImageBox.append(azClockLabel);
        azClockImageBox.append(projectDescriptionLabel);
        azClockLogoGroup.add(azClockImageBox);

        this.add(azClockLogoGroup);
        //-----------------------------------------------------------------------

        //Extension/OS Info Group------------------------------------------------
        let extensionInfoGroup = new Adw.PreferencesGroup();
        let azClockVersionRow = new Adw.ActionRow({
            title: _("Desktop Clock Version"),
        });
        let releaseVersion;
        if(Me.metadata.version)
            releaseVersion = Me.metadata.version;
        else
            releaseVersion = 'unknown';
        azClockVersionRow.add_suffix(new Gtk.Label({
            label: releaseVersion + ''
        }));
        extensionInfoGroup.add(azClockVersionRow);

        let commitRow = new Adw.ActionRow({
            title: _('Git Commit')
        });
        let commitVersion;
        if(Me.metadata.commit)
            commitVersion = Me.metadata.commit;
        commitRow.add_suffix(new Gtk.Label({
            label: commitVersion ? commitVersion : '',
        }));
        if(commitVersion){
            extensionInfoGroup.add(commitRow);
        }

        let gnomeVersionRow = new Adw.ActionRow({
            title: _('GNOME Version'),
        });
        gnomeVersionRow.add_suffix(new Gtk.Label({
            label: imports.misc.config.PACKAGE_VERSION + '',
        }));
        extensionInfoGroup.add(gnomeVersionRow);

        let osRow = new Adw.ActionRow({
            title: _('OS'),
        });
        let osInfoText;
        let name = GLib.get_os_info("NAME");
        let prettyName = GLib.get_os_info("PRETTY_NAME");
        if(prettyName)
            osInfoText = prettyName;
        else
            osInfoText = name;
        let versionID = GLib.get_os_info("VERSION_ID");
        if(versionID)
            osInfoText += "; Version ID: " + versionID;
        let buildID = GLib.get_os_info("BUILD_ID");
        if(buildID)
            osInfoText += "; " + "Build ID: " +buildID;
        osRow.add_suffix(new Gtk.Label({
            label: osInfoText,
            single_line_mode: false,
            wrap: true,
        }));
        extensionInfoGroup.add(osRow);

        let sessionTypeRow = new Adw.ActionRow({
            title: _('Session Type'),
        });
        let windowingLabel;
        if(Me.metadata.isWayland)
            windowingLabel = "Wayland";
        else
            windowingLabel = "X11";
        sessionTypeRow.add_suffix(new Gtk.Label({
            label: windowingLabel,
        }));
        extensionInfoGroup.add(sessionTypeRow);

        this.add(extensionInfoGroup);
        //-----------------------------------------------------------------------

        let linksGroup = new Adw.PreferencesGroup();
        let linksBox = new Adw.ActionRow();

        let pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(Me.path + '/media/donate-icon.svg', -1, 50, true);
        let donateImage = Gtk.Picture.new_for_pixbuf(pixbuf);
        let donateLinkButton = new Gtk.LinkButton({
            child: donateImage,
            uri: 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=53CWA7NR743WC&item_name=Donate+to+support+my+work&currency_code=USD&source=url',
        });

        pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(Me.path + '/media/gitlab-icon.svg', -1, 50, true);
        let gitlabImage = Gtk.Picture.new_for_pixbuf(pixbuf);
        let projectUrl = Me.metadata.url;
        let projectLinkButton = new Gtk.LinkButton({
            child: gitlabImage,
            uri: projectUrl,
        });

        linksBox.add_prefix(projectLinkButton);
        linksBox.add_suffix(donateLinkButton);
        linksGroup.add(linksBox);
        this.add(linksGroup);

        let gnuSoftwareGroup = new Adw.PreferencesGroup();
        let gnuSofwareLabel = new Gtk.Label({
            label: GNU_SOFTWARE,
            use_markup: true,
            justify: Gtk.Justification.CENTER
        });
        let gnuSofwareLabelBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            valign: Gtk.Align.END,
            vexpand: true,
        });
        gnuSofwareLabelBox.append(gnuSofwareLabel);
        gnuSoftwareGroup.add(gnuSofwareLabelBox);
        this.add(gnuSoftwareGroup);
    }
});
    
var GNU_SOFTWARE = '<span size="small">' +
    'This program comes with absolutely no warranty.\n' +
    'See the <a href="https://gnu.org/licenses/old-licenses/gpl-2.0.html">' +
    'GNU General Public License, version 2 or later</a> for details.' +
    '</span>';
