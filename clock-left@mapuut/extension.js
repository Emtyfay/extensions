// Licence: GPLv2+

const Main = imports.ui.main;
const SessionMode = imports.ui.sessionMode;

function init() {
}

function enable() {
    if ( Main.sessionMode.panel.center.indexOf('dateMenu') == -1 ) {
        return;
    }

    let centerBox = Main.panel._centerBox;
    let leftBox = Main.panel._leftBox;
    let dateMenu = Main.panel.statusArea['dateMenu'];
    let children = centerBox.get_children();

    if ( children.indexOf(dateMenu.container) != -1 ) {
        centerBox.remove_actor(dateMenu.container);

        children = leftBox.get_children();
        leftBox.insert_child_at_index(dateMenu.container, 0);
   }
}

function disable() {
    if ( Main.sessionMode.panel.center.indexOf('dateMenu') == -1 ) {
        return;
    }

    let centerBox = Main.panel._centerBox;
    let leftBox = Main.panel._leftBox;
    let dateMenu = Main.panel.statusArea['dateMenu'];
    let children = leftBox.get_children();

    if ( children.indexOf(dateMenu.container) != -1 ) {
        leftBox.remove_actor(dateMenu.container);
        centerBox.add_actor(dateMenu.container);
    }
}
