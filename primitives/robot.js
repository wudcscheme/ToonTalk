 /**
 * Implements ToonTalk's robots
 * box.Authors = Ken Kahn
 * License: New BSD
 */
 
 /*jslint browser: true, devel: true, plusplus: true, vars: true, white: true */

window.TOONTALK.robot = (function (TT) {
    "use strict";
    var robot = Object.create(TT.widget);
    
    robot.create = function (image_url, frontside_conditions, backside_conditions, body, description, thing_in_hand, run_once, next_robot) {
        // frontside_conditions holds a widget that needs to be matched against the frontside of the widget to run
        // backside_conditions holds an object whose keys are type_names of required widgets on the backside
        // and whose values are widgets that need to match backside widgets of that type
        // body holds the actions the robot does when it runs
        var new_robot = Object.create(robot);
        var first_in_team; // who should do the 'repeating'
        var animating = false; // true if animating due to being run while watched
        if (!image_url) {
            // absolute path so saved JSON will work in any environment
            image_url = "http://toontalk.appspot.com/images/RB00.PNG";
        }
        if (!body) {
            body = TT.actions.create();
        }
        if (!description) {
            description = "";
        }
//         if (!width) {
//             // probably should be based upon toontalk-top-level-resource's width
//             width = 100;
//         }
//         if (!height) {
//             height = 100;
//         }
        if (!first_in_team) {
            first_in_team = new_robot;
        }
        new_robot.get_frontside_conditions = function () {
            return frontside_conditions;
        };
        new_robot.set_frontside_conditions = function (new_value) {
            frontside_conditions = new_value;
            if (frontside_conditions) {
                // only makes sense to erase things in frontside_conditions
                TT.widget.erasable(frontside_conditions);
            }
        };
        new_robot.get_backside_conditions = function () {
            return backside_conditions;
        };
        new_robot.set_backside_conditions = function (new_value) {
            backside_conditions = new_value;
            if (backside_conditions) {
                // only makes sense to erase things in frontside_conditions
                TT.UTILITIES.available_types.forEach(function (type) {
                    if (backside_conditions[type]) {
                        TT.widget.erasable(backside_conditions[type]);
                    }
                });
                
            }
        };
        new_robot.get_body = function () {
            return body;
        };
        new_robot.get_image_url = function () {
            return image_url;
        };
        new_robot.set_image_url = function (new_value, update_display) {
            if (image_url === new_value) {
                return false;
            }
            image_url = new_value;
            if (update_display) {
                TT.DISPLAY_UPDATES.pending_update(this);
            }
            return true;
        };
        new_robot.get_animating = function () {
            return animating;
        };
        new_robot.set_animating = function (new_value) {
            var frontside_element = this.get_frontside_element();
            animating = new_value;
            if (animating) {
                // the following didn't work when added to the CSS of toontalk-side-animating
                frontside_element.style["z-index"] = 1000;
                $(frontside_element).addClass("toontalk-robot-animating");
            } else {
                frontside_element.style["z-index"] = 'auto';
                $(frontside_element).removeClass("toontalk-robot-animating");
            }
        };
        new_robot.get_description = function () {
            return description;
        };
        new_robot.set_description = function (new_value, update_display) {
            if (description === new_value) {
                return false;
            }
            description = new_value;
            if (update_display) {
                TT.DISPLAY_UPDATES.pending_update(this);
            }
            return true;
        };
        new_robot.get_thing_in_hand = function () {
            return thing_in_hand;
        };
        new_robot.set_thing_in_hand = function (new_value) {
            thing_in_hand = new_value;
        };
        new_robot.get_next_robot = function () {
            return next_robot;
        };
        new_robot.set_next_robot = function (new_value) {
            var backside_element = this.get_backside_element();
            var drop_area_instructions;
            if (new_value) {
                new_value.set_first_in_team(this.get_first_in_team());
            }
            if (!new_value && next_robot) {
                // next guy is no longer in this team
                next_robot.set_first_in_team(next_robot);
            }
            next_robot = new_value;
            if (backside_element) {
                if (new_value) {
                    drop_area_instructions = "When the robot can't run then this one will try: ";
                } else {
                    drop_area_instructions = window.TOONTALK.robot.empty_drop_area_instructions;
                }
                $(backside_element).find(".toontalk-drop-area-instructions").get(0).innerHTML = drop_area_instructions;
            }
        };
        new_robot.get_first_in_team = function () {
            return first_in_team;
        };
        new_robot.set_first_in_team = function (new_value) {
            first_in_team = new_value;
            if (next_robot) {
                next_robot.set_first_in_team(new_value);
            }
        };
        new_robot.get_run_once = function () {
            return run_once;
        };
        new_robot.set_run_once = function (new_value) {
            run_once = new_value;
        };
        new_robot = new_robot.add_standard_widget_functionality(new_robot);
        if (TT.debugging) {
            this.debug_id = TT.UTILITIES.generate_unique_id();
        }
        return new_robot;
    };
    
    robot.create_backside = function () {
        return TT.robot_backside.create(this).update_run_button_disabled_attribute();;
    };
    
    robot.copy = function (just_value) {
        var frontside_conditions = this.get_frontside_conditions();
        var backside_conditions = this.get_backside_conditions();
        var frontside_conditions_copy = frontside_conditions ? frontside_conditions.copy(true) : undefined;
        var next_robot = this.get_next_robot();
        var next_robot_copy = next_robot ? next_robot.copy(just_value) : undefined;
        var backside_conditions_copy;
        if (backside_conditions) {
            backside_conditions_copy = {};
            TT.UTILITIES.available_types.forEach(function (type) {
                backside_conditions_copy[type] = backside_conditions_copy[type].copy(true);
            });
        }
        var copy = this.create(this.get_image_url(), 
                               frontside_conditions_copy,
                               backside_conditions_copy,
                               this.get_body().copy(),
                               this.get_description(),
                               this.get_thing_in_hand(),
                               this.get_run_once(),
                               next_robot_copy);
        return this.add_to_copy(copy, just_value);
    };
    
    robot.match = function () {
        console.log("Robot-to-robot matching could be more sophisticated.");
        return "matched";
    };
    
    robot.run = function (context, top_level_context, queue) {
        var i;
        var frontside_conditions = this.get_frontside_conditions();
        if (this.stopped || this.being_trained) {
            return 'not matched';
        }
        if (!frontside_conditions) {
            console.log("Training robots without a context not yet implemented.");
            return 'not matched';
        }
        this.match_status = frontside_conditions.match(context);
        if (!this.match_status) {
            this.match_status = 'not matched';
        }
//         console.log("robot#" + this.debug_id + " match_status is " + this.match_status);
        switch (this.match_status) {
        case 'matched':
            if (!queue) {
                queue = TT.QUEUE;
            }
            this.get_body().reset_newly_created_widgets();
            queue.enqueue({robot: this, context: context, top_level_context: top_level_context, queue: queue});
            return this.match_status;
        case 'not matched':
            if (this.get_next_robot()) {
                return this.get_next_robot().run(context, top_level_context, queue);
            }
            return this.match_status;
        default:
            this.match_status.forEach(function (sub_match_status) {
                sub_match_status.run_when_non_empty(this);
            }.bind(this));
            return this.match_status;                    
        }
    };
    
    robot.set_stopped = function (new_value) {
        this.stopped = new_value;
        if (this.stopped) {
            // this is needed because a robot won't start running if it is animating
            // and the animating flag isn't always reset
            this.set_animating(false);
        }
    };
    
    robot.run_actions = function(context, top_level_context, queue) {
        if (this.stopped) { // replace with a method?
            return false;
        }
        if (this.visible()) {
            return this.get_body().run_watched(context, top_level_context, queue, this);
        }
        return this.get_body().run_unwatched(context, top_level_context, queue, this);
    };
    
    robot.picked_up = function (widget, json, is_resource) {
        var path, action_name, widget_copy, new_widget;
        // current_action_name is used to distinguish between removing something from its container versus referring to it
        if (widget.get_infinite_stack && widget.get_infinite_stack()) {
            // does this cause an addition to newly created backside widgets?
            this.current_action_name = "pick up a copy of";
        } else {
            this.current_action_name = "pick up";
        }        
        if (is_resource) {
            new_widget = widget; // this widget was just created
            // robot needs a copy of the resource to avoid sharing it with training widget
            widget_copy = widget.copy();
            path = TT.path.get_path_to_resource(widget_copy);
        } else {
            path = TT.path.get_path_to(widget, this);
        }
        if (path) {
            this.add_step(TT.robot_action.create(path, this.current_action_name), new_widget);
        }
        widget.last_action = this.current_action_name;
        this.current_action_name = undefined;
        this.set_thing_in_hand(widget);
    };
    
    robot.dropped_on = function (source_widget, target_widget) {
        // need to support dropping on backside of a widget as well as which side of a box 
        var path; 
        this.current_action_name = "drop it on";
        path = TT.path.get_path_to(target_widget, this);
        if (path) {
            this.add_step(TT.robot_action.create(path, this.current_action_name));
        }
        source_widget.last_action = this.current_action_name + " " + target_widget.get_type_name();
        this.current_action_name = undefined;
        this.set_thing_in_hand(undefined);
    };
    
    robot.copied = function (widget, widget_copy, picked_up) {
        var path;
        if (picked_up) {
            this.current_action_name = "pick up a copy of";
        } else {
            this.current_action_name = "copy";
        }
        path = TT.path.get_path_to(widget, this);
        if (path) {
            this.add_step(TT.robot_action.create(path, this.current_action_name), widget_copy);
        }
        widget_copy.last_action = this.current_action_name;
        this.current_action_name = undefined;
    };
    
    robot.removed = function (widget) {
        var path;
        this.current_action_name = "remove";
        path = TT.path.get_path_to(widget, this);
        if (path) {
            this.add_step(TT.robot_action.create(path, this.current_action_name));
        }
        widget.last_action = this.current_action_name;
        this.current_action_name = undefined;
    };
    
    robot.edited = function (widget, details) {
        var path;
        this.current_action_name = "edit";
        path = TT.path.get_path_to(widget, this);
        if (path) {
            this.add_step(TT.robot_action.create(path, this.current_action_name, details));
        }
        // no need to update widget.last_action = this.current_action_name;
        this.current_action_name = undefined;
    };
    
    robot.set_erased = function (widget, erased) {
        var path;
        this.current_action_name = "set_erased";
        path = TT.path.get_path_to(widget, this);
        if (path) {
            this.add_step(TT.robot_action.create(path, this.current_action_name, {erased: erased,
                                                                                  toString: erased ? "erase" : "un-erase"}));
        }
        // no need to update widget.last_action = this.current_action_name;
        this.current_action_name = undefined;
    };
    
    robot.remove_from_container = function (part, container) {
        // this is used when running a robot -- not training
        if (this.get_animating()) {
            // if animating then delay removing it
            // otherwise hole empties before the robot gets there
            TT.UTILITIES.add_one_shot_transition_end_handler(this.get_frontside_element(), function () {
                container.removed_from_container(part, false, true);
                });
        } else {
            container.removed_from_container(part);
        }
        // might be new -- following does nothing if already known
        this.add_newly_created_widget(part);
    };
    
    robot.add_step = function (step, new_widget) {
        this.get_body().add_step(step, new_widget);
        this.get_frontside_element().title = this.get_title();
    };
    
    robot.get_context = function () {
        var frontside_element = this.get_frontside_element();
        var $parent_element = $(frontside_element).parent();
        return $parent_element.data("owner");
    };
    
    robot.training_started = function () {
        var context = this.get_context();
        if (!context) {
            console.log("Robot started training but can't find its 'context'.");
            return;
        }
        this.being_trained = true;
        this.set_frontside_conditions(context.copy(true));
        // use minature image as cursor (if there is one)
        $("div").css({cursor: 'url(' + TT.UTILITIES.cursor_of_image(this.get_image_url()) + '), default'});
        this.get_frontside_element().title = this.get_title();
    };
    
    robot.training_finished = function () {
        var newly_created_widgets = this.get_body().get_newly_created_widgets();
        var i, widget;
        $("div").css({cursor: ''}); // restore cursor
        for (i = 0; i < newly_created_widgets.length; i++) {
            widget = newly_created_widgets[i];
            if (widget.last_action === "drop it on top-level" || widget.last_action === "copy") {
                this.add_step(TT.robot_action.create(TT.newly_created_widgets_path.create(i), "add to the top-level backside"));
            }
        }
        TT.DISPLAY_UPDATES.pending_update(this);
        TT.DISPLAY_UPDATES.pending_update(this.get_backside());
        this.being_trained = false;
        this.get_frontside_element().title = this.get_title();
        TT.UTILITIES.backup_all();
    };
    
    robot.update_display = function() {
        // perhaps this should be moved to widget and number and box updated to differ in the to_HTML part
        var frontside = this.get_frontside();
        var backside = this.get_backside();
//         var frontside_conditions = this.get_frontside_conditions();
//         var frontside_conditions_contents_element, frontside_conditions_div;
        var new_first_child, robot_image, frontside_element, resource_becoming_instance;
        var thing_in_hand = this.get_thing_in_hand();
        var thing_in_hand_frontside_element;
        if (TT.debugging) {
             // this can't be done during robot creation since robot actions references to newly_created_widgets is premature
            this.debug_string = this.toString();
        }
        if (!frontside) {
            return;
        }
        frontside_element = frontside.get_element();
        robot_image = this.image();
//         if ($(frontside_element).parent(".toontalk-top-level-resource").length > 0 || !frontside_conditions) {
           
//         } else {
//             frontside_conditions_div = this.frontside_conditions_div();
//             new_first_child.appendChild(frontside_conditions_div);
//             $(robot_image).css({top: "30%"});
            if (thing_in_hand) {
                new_first_child = document.createElement("div");
                $(new_first_child).css({position: "absolute"});
                thing_in_hand_frontside_element = thing_in_hand.get_frontside_element();
                $(thing_in_hand_frontside_element).css({position: "static"});  
                new_first_child.appendChild(thing_in_hand_frontside_element);
                new_first_child.appendChild(robot_image);
            } else {
                 new_first_child = robot_image;
            }
//             frontside_conditions_contents_element = frontside_conditions.get_frontside_element(true);
//             $(frontside_conditions_contents_element).addClass("toontalk-conditions-contents");
//             frontside_conditions_div.appendChild(frontside_conditions_contents_element);
            resource_becoming_instance = frontside_element.firstChild && $(frontside_element.firstChild).is(".toontalk-robot-image");
//         }
        // remove what's there first
        while (frontside_element.firstChild) {
            frontside_element.removeChild(frontside_element.firstChild);
        }
        frontside_element.title = this.get_title();
        $(frontside_element).addClass("toontalk-robot");
        $(new_first_child).addClass("toontalk-widget");
//         frontside_element.style.width = this.get_width() + "px";
//         frontside_element.style.height = this.get_height() + "px";
        // following interfered with resizable
//         $(frontside_element).css({width: this.get_width(),
//                                   height: this.get_height()});
        frontside_element.appendChild(new_first_child);
        if (backside && backside.visible()) {
            TT.DISPLAY_UPDATES.pending_update(backside);
        }
        if (this.match_status === 'not matched') {
            $(frontside_element).addClass("toontalk-robot-not-matched");
        } else {
            $(frontside_element).removeClass("toontalk-robot-not-matched");
        }
        setTimeout( // wait for layout to settle down
            function () {
//                 if (resource_becoming_instance) {
//                     // need to adjust for frontside_conditions
//                     frontside_element.style.top = ($(frontside_element).position().top - $(robot_image).height()) + "px";
//                 }
//                 if (frontside_conditions_contents_element) {
//                     // unclear why but if this outside of the timeout then it has no affect
//                     TT.DISPLAY_UPDATES.pending_update(frontside_conditions);
//                 }
//                 if (frontside_conditions && frontside_conditions.is_in_frontside_conditions) {
//                     frontside_conditions.is_in_frontside_conditions();
//                 }
                if (thing_in_hand) {
                    $(thing_in_hand_frontside_element).addClass("toontalk-held-by-robot");
                    TT.DISPLAY_UPDATES.pending_update(thing_in_hand);
                }
            },
            1);
    };
    
    robot.add_newly_created_widget = function (new_widget) {
        return this.get_body().add_newly_created_widget(new_widget);
    };
    
    robot.add_newly_created_widget_if_new = function (new_widget) {
        return this.get_body().add_newly_created_widget_if_new(new_widget);
    };
    
    robot.get_recently_created_widget = function () {
        var newly_created_widgets = this.get_body().get_newly_created_widgets();
        return newly_created_widgets[newly_created_widgets.length-1];
    };
    
    robot.get_title = function() {
        var description = this.get_description();
        var frontside_element;
        if (description) {
            description = "This robot " + description;
            if (description.lastIndexOf('.') < 0) {
                description = description + ".";
            }
            return description + "\n" + this.toString();
        }
        frontside_element = this.get_frontside_element();
        if ($(frontside_element).is(".toontalk-top-level-resource")) {
            return "Drag this robot to a work area.";   
        }
        return this.toString();
    };
    
    robot.image = function () {
        var image = document.createElement("img");
        image.src = this.get_image_url(); // causes Caja error
        $(image).addClass("toontalk-robot-image");
        return image;    
    };
    
//     robot.frontside_conditions_div = function () {
//         var frontside_conditions = document.createElement("div");
//         $(frontside_conditions).addClass("toontalk-frontside-conditions");
//         if (this.match_status === 'not matched') {
//             $(frontside_conditions).addClass("toontalk-frontside-conditions-not-matched");
//         }
//         return frontside_conditions;
//     };
    
    robot.toString = function () {
        var frontside_conditions = this.get_frontside_conditions();
        var body = this.get_body();
        var prefix = "";
        var postfix = "";
        var frontside_conditions_string;
        var next_robot = this.get_next_robot();
        var robot_description;
        if (!frontside_conditions) {
            return "has yet to be trained.";
        }
        frontside_conditions_string = frontside_conditions.get_description();
        if (this.being_trained) {
            prefix = "is being trained.\n";
            postfix = "\n..."; // to indicates still being constructed
        }
        frontside_conditions_string = TT.UTILITIES.add_a_or_an(frontside_conditions_string);
        robot_description = prefix + "When working on something that matches " + frontside_conditions_string + " he will \n" + body.toString() + postfix;
        if (next_robot) {
            robot_description += "\nIf it doesn't match then the next robot will try to run.\n" + next_robot.toString();
        }
        return robot_description;
    };
    
    robot.get_type_name = function () {
        return "robot";
    };
    
    robot.get_json = function () {
        var frontside_conditions = this.get_frontside_conditions();
        var backside_conditions = this.get_backside_conditions();
        var frontside_conditions_json, backside_conditions_json, next_robot_json;
        if (frontside_conditions) {
            if (frontside_conditions.get_type_name() === 'top-level') {
                frontside_conditions_json = {type: "top_level"};
            } else {
                frontside_conditions_json = frontside_conditions.get_json();
            }
        }
        if (backside_conditions) {
            TT.UTILITIES.available_types.forEach(function (type) {
                if (backside_conditions[type]) {
                    if (!backside_conditions_json) {
                        backside_conditions_json = {};
                    }
                    backside_conditions_json[type] = backside_conditions[type].get_json();
                }
            });
        }
        if (this.get_next_robot()) {
            next_robot_json = this.get_next_robot().get_json();
        }
        return this.add_to_json(
            {semantic:
                 {type: "robot",
                  frontside_conditions: frontside_conditions_json,
                  backside_conditions: backside_conditions_json,
                  body: this.get_body().get_json(),
                  run_once: this.get_run_once(),
                  next_robot: next_robot_json
                  },
             view:
                 {image_url: this.get_image_url(),
                  description: this.get_description()}});
    };
    
    robot.create_from_json = function (json_semantic, json_view) {
        var next_robot, thing_in_hand, backside_conditions;
        if (json_semantic.thing_in_hand) {
            thing_in_hand = TT.UTILITIES.create_from_json(json_semantic.thing_in_hand);
        }
        if (json_semantic.next_robot) {
            next_robot = TT.UTILITIES.create_from_json(json_semantic.next_robot);
        }
        if (json_semantic.backside_conditions) {
            backside_conditions = {};
            TT.UTILITIES.available_types.forEach(function (type) {
                    backside_conditions[type] = TT.UTILITIES.create_from_json(json_semantic.backside_conditions[type]);
            });
        }
        return TT.robot.create(json_view.image_url,
                               // bubble for backwards compatibility -- should be able to remove in the future
                               TT.UTILITIES.create_from_json(json_semantic.frontside_conditions || json_semantic.bubble),
                               backside_conditions,
                               TT.UTILITIES.create_from_json(json_semantic.body),
                               json_view.description,
                               thing_in_hand,
                               json_semantic.run_once,
                               next_robot);
    };
    
    return robot;
}(window.TOONTALK));

window.TOONTALK.robot_backside = 
(function (TT) {
    "use strict";
    var create_frontside_conditions_area = function (frontside_conditions, robot) {
        var description = TT.UTILITIES.create_text_element("Runs only if the widget matches: ");
        var condition_element = frontside_conditions.get_frontside_element(true);
        TT.UTILITIES.set_position_is_absolute(condition_element, false);
        $(condition_element).addClass("toontalk-conditions-contents");
        if (robot.match_status === 'not matched') {
            $(condition_element).addClass("toontalk-conditions-not-matched");
        } else {
            $(condition_element).removeClass("toontalk-conditions-not-matched");
        }
        return TT.UTILITIES.create_horizontal_table(description, condition_element);
    };
    return {
        create: function (robot) {
            var backside = TT.backside.create(robot);
            var backside_element = backside.get_element();
            var frontside_conditions = robot.get_frontside_conditions();
            var frontside_conditions_area = frontside_conditions && create_frontside_conditions_area(frontside_conditions, robot);
            var image_url_input = TT.UTILITIES.create_text_input(robot.get_image_url(), "toontalk-image-url-input", "Image URL&nbsp;", "Type here to provide a URL for the appearance of this robot.");
            var description_text_area = TT.UTILITIES.create_text_area(robot.get_description(), 
                                                                      "toontalk-robot-description-input", 
                                                                      "This&nbsp;robot&nbsp;",
                                                                      "Type here to provide additional information about this robot.");
            var run_once_input = TT.UTILITIES.create_check_box(!robot.get_run_once(),
                                                               "toontalk-run-once-check-box",
                                                               "When finished start again",
                                                               "Check this if you want the robot to start over again after finishing what he was trained to do.");
            var $next_robot_area = TT.UTILITIES.create_drop_area(window.TOONTALK.robot.empty_drop_area_instructions);
            var next_robot = robot.get_next_robot();
            var standard_buttons = TT.backside.create_standard_buttons(backside, robot);
            var infinite_stack_check_box = TT.backside.create_infinite_stack_check_box(backside, robot);
            var image_url_change = function () {
                var image_url = image_url_input.button.value.trim();
                if (robot.set_image_url(image_url, true) && TT.robot.in_training) {
                    TT.robot.in_training.edited(robot, {setter_name: "set_image_url",
                                                        argument_1: image_url,
                                                        toString: "change the image URL to " + image_url + " of the robot",
                                                        button_selector: ".toontalk-run-once-check-box"});
                }
            };
            var description_change = function () {
                var description = description_text_area.button.value.trim();
                if (robot.set_description(description, true) && TT.robot.in_training) {
                    TT.robot.in_training.edited(robot, {setter_name: "set_description",
                                                        argument_1: description,
                                                        toString: "change the description to '" + description + "'' of the robot",
                                                        button_selector: ",toontalk-robot-description-input"});
                }
            };
            var input_table;
            $next_robot_area.data("drop_area_owner", robot);
            // don't do the following if already trained -- or offer to retrain?
            standard_buttons.insertBefore(this.create_train_button(backside, robot), standard_buttons.firstChild);
            image_url_input.button.addEventListener('change', image_url_change);
            image_url_input.button.addEventListener('mouseout', image_url_change);
            description_text_area.button.addEventListener('change', description_change);
            description_text_area.button.addEventListener('mouseout', description_change);
            $(run_once_input.button).click(function (event) {
                var keep_running = run_once_input.button.checked;
                robot.set_run_once(!keep_running);
                if (TT.robot.in_training) {
                    TT.robot.in_training.edited(robot, {setter_name: "set_run_once",
                                                        argument_1: !keep_running,
                                                        toString: "change to " + (keep_running ? "run again" : "run once") + " of the robot",
                                                        button_selector: ".toontalk-run-once-check-box"});
                }
                event.stopPropagation();
            });
            if (frontside_conditions_area) {
                backside_element.appendChild(frontside_conditions_area);
            }
            input_table = TT.UTILITIES.create_vertical_table(description_text_area.container, image_url_input.container, run_once_input.container);
            $(input_table).css({width: "90%"});
            backside_element.appendChild(input_table);
            backside_element.appendChild(standard_buttons);
            backside_element.appendChild(infinite_stack_check_box.container);
            if (next_robot) {
                $next_robot_area.append(next_robot.get_frontside_element());
            }
            backside_element.appendChild($next_robot_area.get(0));
            backside.update_display = function () {
                var frontside_element = robot.get_frontside_element();
                var $containing_backside_element;
                $(description_text_area.button).val(robot.get_description());
                $(image_url_input.button).val(robot.get_image_url());
                $(run_once_input.button).prop("checked", !robot.get_run_once());
                if (frontside_element) {
                    frontside_element.title = robot.get_title();
                    $containing_backside_element = $(frontside_element).closest(".toontalk-backside");
                    if ($containing_backside_element.length > 0) {
                        $containing_backside_element.data("owner").get_backside().update_run_button_disabled_attribute();
                    }                    
                }
                backside.update_run_button_disabled_attribute();
            };
            return backside;
        },
        
        create_train_button: function (backside, robot) {
            var backside_element = backside.get_element();
            var $backside_element = $(backside_element);
            var $train_button = $("<button>Train</button>").button();
            $train_button.addClass("toontalk-train-backside-button");
            var training = false;
            var change_label_and_title = function () {
                if (training) {
                    $train_button.button("option", "label", "Stop training");
                    $train_button.attr("title", "Click to stop training this robot.");
                } else {
                    if (robot.get_body().is_empty()) {
                        $train_button.button("option", "label", "Train");
                        $train_button.attr("title", "Click to start training this robot.");
                    } else {
                        $train_button.button("option", "label", "Re-train");
                        $train_button.attr("title", "Click to start training this robot all over again.");
                    }
                }
            };
            change_label_and_title();
            $train_button.click(function (event) {
                training = !training;
                change_label_and_title();
                if (training) {
                    robot.get_body().reset_steps();
                    TT.robot.in_training = robot;
                    robot.training_started();
                } else {
                    robot.training_finished();
                    TT.robot.in_training = null;
                }
                event.stopPropagation();
            });
            return $train_button.get(0);
        }
        
    };
}(window.TOONTALK));

window.TOONTALK.robot.empty_drop_area_instructions = "Drop a robot here to run when this robot can't."