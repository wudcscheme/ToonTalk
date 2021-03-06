 /**
 * Implements ToonTalk's frontside of a widget
 * Authors: Ken Kahn
 * License: New BSD
 */

/*jslint browser: true, devel: true, plusplus: true, vars: true, white: true */

window.TOONTALK.frontside =
(function (TT) {
    "use strict";
    // following needed due to containment mouse enter of a container from its contents isn't triggered since it has already happened
    var widgets_entered_stack = [];
    return {
        create: function (widget) {
            // where widget is a ToonTalk widget such as a number or a box
            var frontside = Object.create(this);
            var frontside_element = document.createElement('div');
            var $frontside_element = $(frontside_element);
            var click_handler = function (event) {
                if ($(event.target).is('.ui-resizable-handle')) {
                    // don't let resize events cause click response
                    // see http://stackoverflow.com/questions/5709220/how-to-cancel-click-after-resizable-events
                    return;
                }
                if (event.type === 'click' && event.which !== 1) {
                    // only left button opens it -- how could it be other than of 'click' type
                    return;
                }
                if (widget.get_open_backside_only_if_stopped() && widget.get_running()) {
                    return;
                }
                if ($frontside_element.is(".toontalk-top-level-resource") && !event.altKey) {
                    // can open top-level resources with Alt key
                    widget.set_running(!widget.get_running());
                } else {
                    if (TT.open_backside_only_if_alt_key && !event.altKey) {
                        // URL parameter used to restrict opening backside -- useful for puzzle construction
                        return;
                    }
                    widget.open_backside(undefined, event.togetherjsInternal && 0);
                    if (widget.robot_in_training()) {
                        widget.robot_in_training().backside_opened(widget);
                    }
                    widget.backup_all();
                }
                event.stopPropagation();
            };
            var mouse_enter_handler = function (event) {
                selection_feedback(widget, event);
                if (widgets_entered_stack.indexOf(widget) >= 0) {
                    // seems somehow can enter without exiting so this cleans things up in that case
                    widgets_entered_stack = [];
                } else {
                    widgets_entered_stack.push(widget);
                }
            };
            var selection_feedback = function (widget, event) {
                 // note that this highlights the backside if visible even if the widget passes the selection to its parent
                var backside = widget.get_backside();
                var wiggling_widget = (widget.is_empty_hole() ? wiget.get_parent_of_frontside() : widget).get_selection();
                var frontside_element = wiggling_widget.get_frontside_element();
                var $selected = $(frontside_element);
                if (backside) {
                    TT.UTILITIES.highlight_element(backside.get_element());
                }
                // remove anything wiggling before adding something new
                $(".toontalk-wiggle").removeClass("toontalk-wiggle");
                if (!$selected.is(".toontalk-top-level-resource")) {
                    $selected.addClass("toontalk-wiggle");
                }
                event.stopPropagation();
            }
            var mouse_leave_handler = function (event) {
                var backside = widget.get_backside();
                var wiggling_widget = widget.is_empty_hole() ? wiget.get_parent_of_frontside() : widget;
                if (backside) {
                    TT.UTILITIES.remove_highlight();
                }
                $(wiggling_widget.get_frontside_element()).removeClass("toontalk-wiggle");
                widgets_entered_stack.pop();
                if (widgets_entered_stack.length > 0) {
                    selection_feedback(widgets_entered_stack[widgets_entered_stack.length-1], event);
                }
            }
            var visible;
            $(frontside_element).addClass("toontalk-frontside toontalk-side");
            if (widget.get_infinite_stack()) {
                $(frontside_element).addClass("toontalk-infinite-stack");
            }
            frontside_element.toontalk_widget_side = widget;
            TT.UTILITIES.drag_and_drop(frontside_element);
            frontside.get_element = function () {
                return frontside_element;
            };
            frontside.get_widget = function () {
                return widget;
            };
            frontside.visible = function () {
                return visible;
            };
            frontside.set_visible = function (new_value, depth) {
                var widget = this.get_widget();
                // tried to return if no change if visibility but then loading backside of robot lost its conditions
                visible = new_value;
                if (new_value) {
                    TT.UTILITIES.when_attached(this.get_element(true),
                                               widget.render.bind(widget));
                }
                if (widget.walk_children_now_or_later) {
                    widget.walk_children_now_or_later(function (child_side, depth) {
                                                          child_side.set_visible(new_value, depth);
                                                          return true; // go on to next child
                                                      },
                                                      depth);
                }
            };
            // prefer addEventListener over JQuery's equivalent since when I inspect listeners I get a link to this code
            frontside_element.addEventListener('click',      click_handler);
            frontside_element.addEventListener('touchstart', click_handler);
            frontside_element.addEventListener("mouseenter", mouse_enter_handler);
            frontside_element.addEventListener("mouseleave", mouse_leave_handler);
            if (TT.debugging) {
                frontside_element.id = widget._debug_id;
            }
            return frontside;
        },

        update_display: function () {
            return this.get_widget().update_display();
        },

        remove: function () {
            // used to have debugging code that checked if was still attached
            // but when running unwatched might never have been attached
            var element = this.get_element();
            $(element).remove();
            // free the memory (tested and without the following memory footprint grows faster)
            element.toontalk_widget_side = null;
        },

        clear_selection_feedback_stack: function () {
            widgets_entered_stack = [];
        }

    };
}(window.TOONTALK));
