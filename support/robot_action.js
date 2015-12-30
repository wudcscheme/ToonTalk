 /**
 * Implements ToonTalk's generic action of a robot
 * Authors: Ken Kahn
 * License: New BSD
 */
 
 /*jslint browser: true, devel: true, plusplus: true, vars: true, white: true */

window.TOONTALK.robot_action = 
(function (TT) {
    "use strict";
    var unwatched_run_functions =
        {"copy": function (widget, robot) {
            robot.add_newly_created_widget(widget.copy());
            return true;
         },
         "pick up": function (widget, robot) {
             robot.set_thing_in_hand(widget);
             return true;
         },
         "pick up a copy of": function (widget, robot) {
             var widget_copy = widget.copy();
             robot.add_newly_created_widget(widget_copy);
             robot.set_thing_in_hand(widget_copy);
             return true;
         },
         "drop it on": function (target, robot, additional_info) {
             var thing_in_hand;
             if (target) {
                 thing_in_hand = robot.get_thing_in_hand();
                 if (thing_in_hand) {
                     if (thing_in_hand.drop_on) {
                         if (TT.debugging && thing_in_hand === target) {
                             TT.UTILITIES.report_internal_error("Dropping something on itself! " + target);
                         }
                         // might be a robot was running watched but window hidden or robot's context closed
                         // so thing dropped should be removed from DOM
                         $(thing_in_hand.get_frontside_element()).remove();
                         thing_in_hand.drop_on(target, undefined, robot);
                         robot.set_thing_in_hand(undefined);
                         target.rerender();
                         robot.add_newly_created_widget_if_new(thing_in_hand);
                         if (thing_in_hand.robot_waiting_before_next_step === robot) {
                             // NOTE thing_in_hand needs to call robot.run_next_step();
//                              console.log("Expecting " + thing_in_hand + " to run_next_step");
                             if (!additional_info || !additional_info.running_watched) {
                                 thing_in_hand.robot_waiting_before_next_step = undefined;
//                                  console.log("robot_waiting_before_next_step reset for " + thing_in_hand + " in drop it on -- returning false");
                             }
                             return false;
                         }
                         return true;
                     }
                     if (TT.debugging) {
                        TT.UTILITIES.report_internal_error("Thing in robot's hand (" + thing_in_hand + ") doesn't handle 'drop_on'. Robot that " + robot);
                     }
                 } else if (!robot.being_trained && TT.debugging) {
                     TT.UTILITIES.report_internal_error("The robot that '" + robot.toString() + "' is executing drop_on but has nothing in its hand.");
                 }
             } else if (TT.debugging) {
                 TT.UTILITIES.report_internal_error("The robot that '" + robot.toString() + "' is executing drop_on but doesn't know where to drop what its holding");
             }
         },
         "drop it on the text area of": function (target, robot, additional_info) {
             var thing_in_hand;
             if (target) {
                 thing_in_hand = robot.get_thing_in_hand();
                 if (thing_in_hand) {
                     robot.set_thing_in_hand(undefined);
                     target[additional_info.setter](thing_in_hand);
                     return true;
                 }
                 TT.UTILITIES.report_internal_error("The robot that '" + robot.toString() + "' is executing dropped_on_text_area but has nothing in its hand.");
             } else {
                TT.UTILITIES.report_internal_error("The robot that '" + robot.toString() + "' is executing dropped_on_text_area but doesn't know where to drop what its holding");
             }   
         },
         "remove": function (widget, robot) {
             widget.remove();
             if (widget === robot) {
                 robot.set_stopped(true);
             }
             return true;
         },
         "change whether erased": function (widget, robot, additional_info) {
             if (!widget.set_erased) {
                 TT.UTILITIES.display_message("Robot is unable to erase " + widget);
                 return;
             }
             widget.set_erased(!widget.get_erased());
             return true;
         },
         "edit": function (widget, robot, additional_info) {
             // uses setter_name instead of the function itself so can be JSONified
             // could replace with function on first use if this is a performance issue
             if (!widget[additional_info.setter_name]) {
                 TT.UTILITIES.report_internal_error(widget + " cannot be edited.");
                 return;
             }
             if (additional_info.argument_2) {
                 widget[additional_info.setter_name].call(widget, additional_info.argument_1, additional_info.argument_2, widget.visible());
             } else {
                 widget[additional_info.setter_name].call(widget, additional_info.argument_1, widget.visible());
             }
             return true;
         },
         "change size of": function (widget, robot, additional_info) {
             // nothing to do if unwatched
             return true;
         },
         "add to the top-level backside": function (widget, robot, additional_info) {
             var context_frontside_position, widget_frontside_element, top_level_element;
             if (!robot.visible()) {
                 // the condition is because this code is shared by the watched version and it has already done this
                 // could add an extra argument that indicates that it is call from the watched version
                 widget_frontside_element = widget.get_frontside_element(true);
                 context_frontside_position = $(robot.get_context().get_frontside_element()).position();
                 // need to test the following rewrite:
                 top_level_element = $(robot.get_context().get_frontside_element()).closest(".toontalk-top-level-backside").get(0) ||
                                     $(widget_frontside_element).closest(".toontalk-top-level-backside").get(0);
                 $(widget_frontside_element).css({left: context_frontside_position.left,
                                                  top:  context_frontside_position.top});
                 top_level_element.appendChild(widget_frontside_element);
                 top_level_element.toontalk_widget_side.get_widget().add_backside_widget(widget);
                 widget.animate_to_element(top_level_element, undefined, robot.transform_animation_speed(TT.UTILITIES.default_animation_speed));
             }
             return true;
         },
         "add a new widget to the work space": function (widget, robot, additional_info) {
             var widget_frontside_element, robot_location;
             if (robot.get_context().is_top_level()) {
                 widget_frontside_element = robot.add_to_top_level_backside(widget);
                 robot_location = $(robot.get_frontside_element()).offset();
                 widget.update_display(); // so it has width and height for the following
                 TT.UTILITIES.set_position_relative_to_top_level_backside($(widget_frontside_element), robot_location, true);
             } else {
                 widget.drop_on(robot.get_context().get_backside(true), undefined, robot, true);
             }
             return true;
         },
         "start training": function (trained_robot, robot, additional_info) {
             trained_robot.training_started(robot);
             return true;
         },
         "stop training": function (trained_robot, robot, additional_info) {
             trained_robot.training_finished();
             return true;
         },
         "train": function (robot_in_training, robot, additional_info) {
             robot_in_training.add_step(additional_info.step);
         },
         "open the backside": function () {
             // no need to do this if unwatched
             return true;
         },
         "close the backside": function () {
             // no need to do this if unwatched
             return true;
         },
         "click the button of": function () {
             // no need to do this if unwatched
             return true;
         }
    };
    var pick_up_a_copy_animation = function (widget, robot, continuation, additional_info) {
        var new_continuation = function () {
            var copy;
            continuation();
            if (robot.animate_consequences_of_actions()) {
                copy = robot.get_recently_created_widget();
                // ensure that newly created copy is visible
                if (copy) {
                    copy.set_visible(true);
                    TT.UTILITIES.copy_frontside_dimensions(widget, copy);
                    robot.update_display();
                }
            }
            robot.run_next_step();
        };
        move_robot_animation(widget, robot, new_continuation, additional_info);
    };
    var move_robot_animation = function (side, robot, continuation, additional_info) {
        var thing_in_hand = robot.get_thing_in_hand();
        var robot_frontside_element = robot.get_frontside_element();
        var widget_element = side.get_element();
        var widget_width,
            widget_height,
            left_offset,
            top_offset,
            animation_left_offset,
            animation_top_offset,
            thing_in_hand_element,
            thing_in_hand_width,
            thing_in_hand_height,
            robot_location,
            thing_in_hand_location;
        if (!widget_element) {
            widget_element = TT.UTILITIES.find_resource_equal_to_widget(side);
        }
        if (!TT.UTILITIES.is_attached(widget_element) || !robot.visible()) {
            // is running in a context where the source of this widget isn't available
            // e.g. published page or test file without standard resource widgets
            continuation();
            return;
        }
        widget_width  = $(widget_element).width();
        widget_height = $(widget_element).height();
        if (additional_info && additional_info.left_offset_fraction) {
            if (!robot.original_animation_left_offset) {
                robot.original_animation_left_offset = [];
            }
            if (!robot.original_animation_top_offset) {
                robot.original_animation_top_offset = [];
            }
            animation_left_offset = additional_info.left_offset_fraction*widget_width;
            animation_top_offset  = additional_info.top_offset_fraction*widget_height;
            if (thing_in_hand) {
                thing_in_hand_element = thing_in_hand.get_element();
                if (TT.UTILITIES.visible_element(thing_in_hand_element)) {
                    thing_in_hand_location = $(thing_in_hand_element).offset();
                    robot_location         = $(robot_frontside_element).offset();
                    animation_left_offset -= thing_in_hand_location.left-robot_location.left;
                    animation_top_offset  -= thing_in_hand_location.top -robot_location.top;
                }
            }
            if (thing_in_hand && 
                robot.original_animation_left_offset.indexOf(animation_left_offset) >= 0 && 
                robot.original_animation_top_offset .indexOf(animation_top_offset)  >= 0) {
                // robot has already dropped something here
                animation_left_offset = robot.animation_left_offset+robot.last_thing_in_hand_width;
                animation_top_offset  = robot.animation_top_offset;
                if (animation_left_offset >= widget_width) {
                    animation_left_offset = 0;
                    animation_top_offset += robot.max_thing_in_hand_height;
                    if (animation_top_offset >= widget_height) {
                        animation_top_offset = 0;
                    }
                }
                robot.last_thing_in_hand_width = $(thing_in_hand_element).width();
                if (typeof robot.max_thing_in_hand_height === 'undefined') {
                    robot.max_thing_in_hand_height = 0;
                }
                robot.max_thing_in_hand_height = Math.max(robot.max_thing_in_hand_height, $(thing_in_hand_element).height());
            } else {
                robot.original_animation_left_offset.push(animation_left_offset);
                robot.original_animation_top_offset .push(animation_top_offset);
                robot.last_thing_in_hand_width = $(thing_in_hand_element).width();
                robot.max_thing_in_hand_height = $(thing_in_hand_element).height();
            }
            widget_element.animation_left_offset = animation_left_offset;
            widget_element.animation_top_offset  = animation_top_offset;
            robot.animation_left_offset = animation_left_offset;
            robot.animation_top_offset  = animation_top_offset;
        } else {
            left_offset = widget_width/2;
            top_offset  = widget_height/2;
        }
        // robots move at 1/4 pixel per millisecond for clarity
        robot.animate_to_widget(side,
                                continuation,
                                robot.transform_animation_speed(.25),
                                left_offset, top_offset,
                                true,
                                robot.transform_original_step_duration(additional_info && additional_info.time));
    };
    var pick_up_animation = function (widget_side, robot, continuation, additional_info) {
        var new_continuation = function () {
            continuation();
            if (robot.animate_consequences_of_actions()) {
                // need to update_display so that robot is shown holding what was picked update_display
                // and if dropped soon its location is known
                robot.update_display();
            }
            robot.run_next_step();
        };
        if (TT.debugging && widget_side.get_type_name() === 'empty hole') {
            TT.UTILITIES.report_internal_error("Robot trying to pick up an empty hole.");
            return;
        }
        if (widget_side.save_dimensions() && robot.animate_consequences_of_actions()) {
            move_robot_animation(widget_side, robot, new_continuation, additional_info);
        } else {
            new_continuation();
        }
    };
    var drop_it_on_animation = function (target, robot, continuation, additional_info) {
        var thing_in_hand = robot.get_thing_in_hand();
        var thing_in_hand_element, new_continuation;
        if (!thing_in_hand) {
            if (TT.debugging) {
                TT.UTILITIES.report_internal_error("Expected the robot to be holding something.");
                // since the robot's description can be long add it the console
                console.log("The robot is " + robot);
            }
            move_robot_animation(target, robot, continuation, additional_info);
            return;
        }
        if (TT.debugging && thing_in_hand === target) {
            TT.UTILITIES.report_internal_error("Dropping something on itself!");
        }
        thing_in_hand_element = thing_in_hand.get_element(true);
        thing_in_hand.set_visible(robot.visible());
        new_continuation = function () {
            var $top_level_element;
            $(thing_in_hand_element).removeClass("toontalk-held-by-robot");
            if (thing_in_hand.drop_on) {
                if (robot.animate_consequences_of_actions()) {
                    // need to see it before actions such as Bammer take place
                    if (!TT.UTILITIES.visible_element(thing_in_hand_element)) {
                        $top_level_element = $(robot.get_frontside_element()).closest(".toontalk-top-level-backside")
                        if ($top_level_element.length > 0) {
                            $top_level_element.get(0).appendChild(thing_in_hand_element);
                        }
                    }
                }
                robot.rerender();
            }
            continuation();
            if (thing_in_hand.drop_on && thing_in_hand.visible()) {
                TT.UTILITIES.set_absolute_position(thing_in_hand_element, $(thing_in_hand_element).offset());
                thing_in_hand.restore_dimensions();
            }
            if (thing_in_hand.robot_waiting_before_next_step !== robot) {
                robot.run_next_step();
            }
        };
        if (target.is_backside() && !TT.UTILITIES.visible_element(target.get_element())) {
            click_and_open_backside(target.get_widget(), robot, new_continuation, additional_info);
        } else {
            move_robot_animation(target, robot, new_continuation, additional_info);
        }
    };
    var drop_it_on_text_area_animation = function (target, robot, continuation, additional_info) {
        var thing_in_hand = robot.get_thing_in_hand();
        var thing_in_hand_element, adjust_dropped_location_continuation, find_text_area, text_area;
        if (!thing_in_hand) {
            TT.UTILITIES.report_internal_error("Expected the robot to be holding something.");
            console.log("The robot is " + robot);
            move_robot_animation(target, robot, continuation, additional_info);
            return;
        }
        thing_in_hand_element = thing_in_hand.get_element(true);
        thing_in_hand.set_visible(robot.visible());
        adjust_dropped_location_continuation = function () {
            var $top_level_element, parent;
            $(thing_in_hand_element).removeClass("toontalk-held-by-robot");
            // the following removes dropped which is a small problem if Bammer is added to this since it may be too soon
            continuation();
//          $(text_area).trigger('change');
            thing_in_hand.remove();
            // need to render the modified element and its parent (unless that is the top level)
            parent = target.get_parent_of_frontside().get_widget();
            if (parent.is_hole()) {
                parent = parent.get_parent_of_frontside();
            }
            if (parent.is_top_level()) {
                target.render();
            } else {
                parent.render();
            }
            robot.set_thing_in_hand(undefined);
            robot.run_next_step();
        }
        find_text_area = function () {
            // will be called once the backside exists
            return $(target.get_backside_element()).find(additional_info.area_selector).get(0);
        };
        robot.rerender();
        if (!TT.UTILITIES.visible_element(target.get_backside_element())) {
            click_and_open_backside(target, 
                                    robot,
                                    function () {
                                         text_area = find_text_area();
                                         robot.animate_to_element(text_area, adjust_dropped_location_continuation, robot.transform_animation_speed(TT.UTILITIES.default_animation_speed/2), 0, 0, true);
                                    },
                                    additional_info);
        } else {
            text_area = find_text_area();
            robot.animate_to_element(text_area, adjust_dropped_location_continuation, robot.transform_animation_speed(TT.UTILITIES.default_animation_speed/2), 0, 0, true);
        }
    };
    var click_and_open_backside = function (widget, robot, continuation, additional_info) {
        // assumes widget's backside isn't being displayed
        var open_backside_continuation = function () {
            widget.open_backside(continuation);
            close_backside_when_finished(widget, robot);
        };
        move_robot_animation(widget, robot, open_backside_continuation, additional_info);
    };
    var find_backside_element = function (widget, class_name_selector) {
        var backside_element = widget.get_backside_element(true);
        return $(backside_element).find(class_name_selector).get(0);
    };
    var button_use_animation = function (widget, robot, continuation, class_name_selector, additional_info, delay) {
        var button_element = find_backside_element(widget, class_name_selector);
        var robot_frontside_element = robot.get_frontside_element();
        var button_visible = button_element && $(button_element).is(":visible");
        var new_continuation = function () {
            continuation(button_element);
            $(button_element).addClass("ui-state-active");
            if (class_name_selector === ".toontalk-select-function" || class_name_selector === ".toontalk-box-size-input") {
                button_element.value = additional_info.argument_1;
            }
            setTimeout(function () {
                           $(button_element).removeClass("ui-state-active");
                           if (!button_visible && widget.get_backside()) {
                               // restore things at cycle end
                               robot.add_body_finished_listener(function () {
                                   if (widget.get_backside()) {
                                       widget.get_backside().hide_backside();
                                   }
                               });         
                           }
                           robot.run_next_step();
                      },
                      delay);
        };
        var animation_continuation = function () {
            if (!TT.UTILITIES.visible_element(button_element) && backside) {
                // open advanced settings if button isn't visible
                backside.set_advanced_settings_showing(true, backside.get_element());
            }
            // robots move at 1/4 pixel per millisecond for clarity
            robot.animate_to_element(button_element, new_continuation, robot.transform_animation_speed(TT.UTILITIES.default_animation_speed/2), 0, 0, true);
        }
        var backside;
        if (!button_visible && widget.open_backside && robot.animate_consequences_of_actions()) {
            widget.open_backside(animation_continuation);
            close_backside_when_finished(widget, robot);
        } else {
            animation_continuation();
        }
    };
    var move_to_tool_and_use_animation = function (widget, robot, continuation, tool_held_by_robot_css_class, resource_tool_css_class) {
        var tool_element = $("." + resource_tool_css_class).get(0);
        var new_continuation = function () {
            tool_use_animation(widget, robot, continuation, tool_held_by_robot_css_class);
        };
        if (tool_element && robot.animate_consequences_of_actions()) {
            robot.animate_to_element(tool_element, new_continuation, robot.transform_animation_speed(TT.UTILITIES.default_animation_speed), 0, 0, true);
        } else {
            new_continuation();
        }
    };
    var tool_use_animation = function (widget, robot, continuation, tool_held_by_robot_css_class) {
        var robot_frontside_element = robot.get_frontside_element();
        var new_continuation = function () {
            robot.carrying_tool = undefined;
            robot.update_display(); // to stop displaying tool
            continuation();
            robot.run_next_step();
        };
        if (!robot.animate_consequences_of_actions()) {
            continuation();
            robot.run_next_step();
            return;
        }
        robot.carrying_tool = tool_held_by_robot_css_class;
        robot.update_display(); // to display tool
        // robots move at 1/4 pixel per millisecond for clarity
        robot.animate_to_element(widget.get_element(), new_continuation, robot.transform_animation_speed(TT.UTILITIES.default_animation_speed/2), 0, 0, true);
    };
    var copy_animation = function (widget, robot, continuation) {
        var new_continuation = function () {
            continuation();
            widget.add_copy_to_container(robot.get_recently_created_widget());
        };
        move_to_tool_and_use_animation(widget, robot, new_continuation, "toontalk-wand-small", "toontalk-wand");
    };
    var remove_or_erase_animation = function (widget, robot, continuation) {
        var parent = widget.get_parent_of_frontside();
        var new_continuation = function () {
            continuation();
            if (parent && parent.get_widget().get_type_name() !== 'top-level' && parent.update_display) {
                parent.update_display();
            }
            widget.rerender(); // if wasn't removed
        };
        move_to_tool_and_use_animation(widget, robot, new_continuation, "toontalk-vacuum-ready-small", "toontalk-vacuum");
    };
    var edit_animation = function (widget, robot, continuation, additional_info) {
        var new_continuation = function () {
            var widget_backside = widget.get_backside();
            if (widget_backside) {
                // maybe this should have been created and displayed
                widget.get_backside().update_display();
            }
            continuation();
        };
        button_use_animation(widget, robot, new_continuation, additional_info.button_selector, additional_info, robot.transform_step_duration(1000));
    };
    var change_size_animation = function (widget, robot, continuation, additional_info) {
       var frontside_element = widget.get_frontside_element();
       var new_continuation;
       if (!frontside_element) {
           // was hidden while running
           continuation();
           robot.run_next_step();
           return;
       }
       new_continuation = function () {
            var width  = $(frontside_element).width();
            var height = $(frontside_element).height();
            var new_width  = width *additional_info.x_factor;
            var new_height = height*additional_info.y_factor;
            var duration = robot.transform_step_duration(1000);
            $(frontside_element).addClass("toontalk-animating-element");
            frontside_element.style.transitionDuration = duration+"ms";
            frontside_element.style.width  = new_width +"px";
            frontside_element.style.height = new_height+"px";
            setTimeout(function () {
                           $(frontside_element).removeClass("toontalk-animating-element");
                           frontside_element.style.transitionDuration = '';
                           continuation();
                           widget.render();
                           robot.run_next_step();
                       },
                       duration);
        }
        robot.animate_to_element(frontside_element, new_continuation, robot.transform_animation_speed(TT.UTILITIES.default_animation_speed), 0, 0, true);
    };
    var animate_widget_creation = function (widget, robot, continuation, additional_info) {
        var show_button_use = additional_info && additional_info.button_selector;
        var source_widget;
        if (show_button_use) {
            source_widget = TT.path.dereference_path(additional_info.path_to_source, robot);
            button_use_animation(source_widget, robot, continuation, additional_info.button_selector, additional_info, robot.transform_step_duration(3000));
        } else {
            continuation();
            robot.run_next_step();
        }      
    };
    var start_training_animation = function (robot_to_train, robot, continuation) {
        var backside_of_other = robot_to_train.open_backside();
        var robot_to_train_frontside_element = robot_to_train.get_frontside_element();
        continuation();
        if (backside_of_other) {
            $(backside_of_other.get_element()).find(".toontalk-train-backside-button").click();
        } 
        $(robot_to_train_frontside_element).addClass("toontalk-robot-animating toontalk-robot-being-trained-by-robot");
        robot_to_train_frontside_element.toontalk_followed_by = {element: robot.get_frontside_element(),
                                                                 left_offset: 30,
                                                                 top_offset: -20};
        robot_to_train_frontside_element.toontalk_return_to = $(robot_to_train_frontside_element).offset();
        robot.run_next_step();
    };
    var stop_training_animation = function (trained_robot, robot, continuation, additional_info) {
        var trained_robot_frontside_element = trained_robot.get_frontside_element();
        var new_continuation = function () {
            var robot_returned_continuation = function () {
                trained_robot_frontside_element.toontalk_return_to = undefined;
                trained_robot.get_backside().change_label_and_title_of_train_button(false);
                $(trained_robot_frontside_element).removeClass("toontalk-robot-animating toontalk-robot-being-trained-by-robot");
                trained_robot_frontside_element.toontalk_followed_by = undefined;
                setTimeout(continuation, robot.transform_step_duration(1500));                      
            };
            if (trained_robot_frontside_element.toontalk_return_to) {
                TT.UTILITIES.animate_to_absolute_position(trained_robot_frontside_element,
                                                          trained_robot_frontside_element.toontalk_return_to,
                                                          robot_returned_continuation,
                                                          robot.transform_animation_speed(TT.UTILITIES.default_animation_speed));
            } else {
                robot_returned_continuation();
            }
         };
         button_use_animation(trained_robot, robot, new_continuation, ".toontalk-train-backside-button", additional_info, robot.transform_step_duration(1000));
    };
    var train_another_animation = function (robot_being_trained, robot, continuation, additional_info) {
        var new_continuation = function () {
            continuation();
            robot.run_next_step();
        };
        var watched_step = additional_info.step.run_watched;
        if (!watched_step) {
            new_continuation();
            return;
        }
        robot_being_trained.run_next_step = new_continuation;
        robot_being_trained.set_context(robot_being_trained.get_parent_of_frontside().get_widget());
        watched_step(robot_being_trained);
    };
    var open_backside_animation = function (widget, robot, continuation) {
        widget.open_backside(function () {
                                 continuation();
                                 robot.run_next_step();
                             });
        close_backside_when_finished(widget, robot);
    };
    var close_backside_when_finished = function (widget, robot) {
        // restore things at cycle end in case the robot wasn't trained to close backsides
        robot.add_body_finished_listener(
            function () {
                if (widget.get_backside()) {
                    widget.get_backside().hide_backside();
                } // else might have been removed subsequently
            });
    };
    var close_backside = function (widget, robot, continuation, additional_info) {
        var delay = robot.transform_original_step_duration(additional_info && additional_info.time);
        setTimeout(function () {
                       $(widget.get_backside_element()).children(".toontalk-close-button").click();
                       continuation();
                       robot.run_next_step();
                   },
                   delay);     
    };
    var click_button_animation = function (widget, robot, continuation, additional_info) {
        var new_continuation = function (button_element) {
            $(button_element).click();
            continuation();
        };
        button_use_animation(widget, robot, new_continuation, additional_info.button_selector);
    };
    var watched_run_functions = 
        {"copy":                              copy_animation,
         "pick up":                           pick_up_animation,
         "pick up a copy of":                 pick_up_a_copy_animation,
         "drop it on":                        drop_it_on_animation,
         "drop it on the text area of":       drop_it_on_text_area_animation,
         // remove and erase have identical animation but different unwatched semantics
         "remove":                            remove_or_erase_animation,
         "change whether erased":             remove_or_erase_animation, 
         "edit":                              edit_animation,
         "change size of":                    change_size_animation,
         "add to the top-level backside": function (widget, robot, continuation) {
              // do nothing -- this action is only needed if unwatched
              continuation();
              robot.run_next_step();
         },
         "add a new widget to the work space": animate_widget_creation,
         "start training":                     start_training_animation,
         "stop training":                      stop_training_animation,
         "train":                              train_another_animation,
         "open the backside":                  open_backside_animation,
         "close the backside":                 close_backside,
         "click the button of":                click_button_animation
    };

    TT.creators_from_json["robot_action"] = function (json, additional_info) {
        if (json.additional_info) {
            return TT.robot_action.create(TT.path.create_from_json(json.path, additional_info), json.action_name, TT.UTILITIES.create_keys_from_json(json.additional_info, additional_info));
        } else {
            return TT.robot_action.create(TT.path.create_from_json(json.path, additional_info), json.action_name);
        }
    };
    
    return {
        create: function (path, action_name, additional_info) {
            var new_action = Object.create(this);
            var unwatched_run_function = unwatched_run_functions[action_name];
            var watched_run_function   = watched_run_functions[action_name];
            if (!watched_run_function) {
                TT.UTILITIES.report_internal_error("No watched function for " + action_name);
                return;
            }
            if (!path) {
                TT.UTILITIES.report_internal_error("path undefined in " + action_name + " action");
            }
            if (!unwatched_run_function) {
                TT.UTILITIES.report_internal_error("no run_function for " + action_name);
            }
            new_action.get_action_name = function () {
                return action_name;
            };
            new_action.get_additional_info = function () {
                return additional_info;
            };
            new_action.run_unwatched = function (robot) {
                var referenced = TT.path.dereference_path(path, robot);
                if (!referenced) {
                    TT.UTILITIES.report_internal_error("Unable to dereference path: " + TT.path.toString(path) + " in context: " + robot.get_context());
                    return false;
                }
                if (TT.logging && TT.logging.indexOf('event') >= 0) {
                    if (referenced.wait_until_this_nest_receives_something) { 
                        console.log("   wait_until_this_nest_receives_something " + 
                                    referenced.wait_until_this_nest_receives_something.to_debug_string() + 
                                    "(" + TT.path.toString(path) + 
                                    ") by unwatched " + robot.to_debug_string());
                    } else {
                        console.log("   " + referenced.to_debug_string() + " (" + TT.path.toString(path) + " " + referenced.to_debug_string() + 
                                    " by unwatched " + robot.to_debug_string());
                    }
                }
                if (referenced.wait_until_this_nest_receives_something) {         
                    referenced.wait_until_this_nest_receives_something.run_when_non_empty(
                        function () {
                            this.run_unwatched(robot);
                                    }.bind(this),
                        robot);
                    return;
                }
                if (unwatched_run_function(referenced, robot, additional_info)) {
                    robot.run_next_step();
                } // else robot will stop due to the error
            };
            new_action.run_watched = function (robot) {
                var referenced = TT.path.dereference_path(path, robot); 
                var continuation = function () {
                    if (robot.stopped() && !robot.being_trained) {
                        // don't stop if this is a robot being trained by another robot
                        return;
                    }
                    if (!additional_info) {
                        additional_info = {};
                    }
                    additional_info.running_watched = true;
                    // do the action unwatched
                    unwatched_run_function(referenced, robot, additional_info);
                }
                if (!referenced) {
                    TT.UTILITIES.report_internal_error("Unable to dereference the path: " + TT.path.toString(path) + " in context: " + robot.get_context());
                    return;
                }
                if (TT.logging && TT.logging.indexOf('event') >= 0) {
                    console.log("   " + referenced + " (" + TT.path.toString(path) + " " +  referenced.to_debug_string() + 
                                " by watched " + robot.to_debug_string() + (robot.animate_consequences_of_actions() ? "" : " finishing instantly"));
                }
                if (referenced.wait_until_this_nest_receives_something) {
                    referenced.wait_until_this_nest_receives_something.run_when_non_empty(
                        function () {
                            robot.set_waiting(false);
                            this.run_watched(robot);
                        }.bind(this),
                        robot);
                    robot.set_waiting(true);
                    if (!TOONTALK.UTILITIES.visible_element(robot.get_context().get_backside_element())) {
                        // backside robot is working on is no longer visible so robot should not be either
                        robot.get_frontside().remove();
                    }
                    return;
                }
//                 referenced.set_visible(robot.visible());
                watched_run_function(referenced, robot, continuation, additional_info);
            };
            new_action.toString = function (to_string_info) {
                var suffix = "";
                var prefix = "";
                var action_description = action_name; // default description is its name
                var path_description, trained_action;
                if (action_name === "open the backside" || 
                    action_name === "close the backside") {
                    // not interesting enough
                    return "";
                }
                if (action_name === "click the button of") {
                    switch (additional_info.button_selector) {
                    case ".toontalk-green-flag":
                        action_description = "click the green flag " +
                                              TT.UTILITIES.encode_HTML_for_title("<span class='toontalk-green-flag-icon'></span>") + 
                                              " of";
                        break;
                    case ".toontalk-stop-sign":
                        action_description = "click the stop sign " +
                                             TT.UTILITIES.encode_HTML_for_title("<span class='toontalk-stop-sign-icon'></span>") + 
                                             " of";
                        break;
                    case ".toontalk-play-sound-effect-button":
                        action_description = "click the 'Play Sound' button of";
                        break;
                    case ".toontalk-settings-backside-button":
                        action_description = "open the advanced settings of";
                        break;
                    case ".toontalk-show-attributes-chooser-button":
                        action_description = "click the button to add or remove attributes of ";
                        break;
                    case ".toontalk-remove-backside-and-widget-buttton":
                        action_description = "click the button to remove the back and front of ";
                        break;
                    default:
                        action_description = "click a button of";
                        break;
                    }
                }
                if (action_name === "add a new widget to the work space") {
                    return action_name.replace("a new widget", TT.path.toString(path));
                }
                if (action_name === "add to the top-level backside") {
                    // is used for internal bookkeepping shouldn't be user visible
                    return "";
                }
                if (!to_string_info) {
                    to_string_info = {};
                }
                path_description = TT.path.toString(path, to_string_info);
                if (action_name === 'edit' || action_name === 'drop it on the text area of') {
                    suffix = " (" + additional_info.toString + ")";
                } else if (action_name === 'train') {
                    // the actions of the robot should use he or she but not I
                    trained_action = additional_info.step.toString({person: "third"});
                    if (trained_action === "") {
                        return trained_action;
                    }
                    suffix = " to " + trained_action;
                    // indent actions trained 
                    prefix = "- ";
                    if (to_string_info && to_string_info.robot_being_trained_description) {
                        path_description = to_string_info.robot_being_trained_description;
                    }
                } else if (action_name === 'start training') {
                    if (to_string_info) {
                        to_string_info.robot_being_trained_description = "it"; // him?
                    }
                } else if (action_name === 'stop training') {
                    path_description = to_string_info.robot_being_trained_description;
                    to_string_info.robot_being_trained_description = undefined;
                } 
                if (['pick up', 'edit', 'remove', 'copy', 'change whether erased', 'pick up a copy of', 'drop it on the text area of'].indexOf(action_name) >= 0) {
                    if (path_description.indexOf("hole of") >= 0) {
                        return prefix + action_description + " what is in " + path_description + suffix;
                    }
                    if (path_description.indexOf("a When") === 0) { // startsWith in ECMAScript 6
                        // 'a when' occurs because robot's titles are best just jumping in saying  "When ..." but then when 
                        // the robot itself is being manipulated then an indefinite article is added
                        path_description = path_description.substring(3);
                        path_description = TT.UTILITIES.remove_encoded_HTML(path_description);
                        // might be long so elide it
                        path_description = TT.UTILITIES.elide(path_description, 80, 1);
                        if (path_description[path_description.length-1] === ".") {
                            // remove period from robot's description
                            path_description = path_description.substring(0, path_description.length-1);
                        }
                        return prefix + action_description + " a robot who w" + path_description + suffix + "\n";
                    }
                }
                return prefix + action_description + " " + path_description + suffix;
            };
            new_action.get_json = function (json_history, callback, start_time) {
                var keys_callback = function (keys_json, start_time) {
                    var path_callback = function (path_json, start_time) {
                        callback({type: "robot_action",
                                  action_name: action_name,
                                  path: path_json,
                                  additional_info: keys_json},
                                 start_time);
                    };
                    TT.path.get_json(path, json_history, path_callback, start_time);
                };
                if (additional_info) {
                    TT.UTILITIES.get_json_of_keys(additional_info, ["running_watched"], keys_callback, start_time);
                } else {
                    keys_callback(undefined, start_time);
                }
            };
            return new_action;  
        }
    };

}(window.TOONTALK));