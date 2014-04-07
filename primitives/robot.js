 /**
 * Implements ToonTalk's robots
 * box.Authors = Ken Kahn
 * License: New BSD
 */
 
 /*jslint browser: true, devel: true, plusplus: true, vars: true, white: true */

window.TOONTALK.robot = (function (TT) {
    "use strict";
    var robot = Object.create(TT.widget);
    
    robot.create = function (image_url, bubble, body, description, width, height, thing_in_hand, run_once, next_robot) {
        // bubble holds the conditions that need to be matched to run
        // body holds the actions the robot does when it runs
        var new_robot = Object.create(robot);
        if (!image_url) {
            image_url = "images/RB00.PNG";
        }
		if (!body) {
			body = TT.actions.create();
		}
		if (!width) {
			// probably should be based upon toontalk-top-level-resource's width
			width = 100;
		}
		if (!height) {
			height = 100;
		}
        new_robot.get_bubble = function () {
            return bubble;
        };
		new_robot.set_bubble = function (new_value) {
			bubble = new_value;
		};
        new_robot.get_body = function () {
            return body;
        };
        new_robot.get_image_url = function () {
            return image_url;
        };
        new_robot.set_image_url = function (new_value, update_display) {
            image_url = new_value;
			if (update_display) {
				this.update_display();
			}
        };
		// should the following use 'width' from the frontside element?
		new_robot.get_width = function () {
			return width;
		};
		new_robot.set_width = function (new_value) {
			width = new_value;
		};
		new_robot.get_height = function () {
			return height;
		};
		new_robot.set_height = function (new_value) {
			height = new_value;
		};
		new_robot.get_description = function () {
			return description;
		};
		new_robot.set_description = function (new_value, update_display) {
			description = new_value;
			if (update_display) {
				this.update_display();
			}
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
			next_robot = new_value;
		};
		new_robot.get_run_once = function () {
			return run_once;
		};
		new_robot.set_run_once = function (new_value) {
			run_once = new_value;
		};
		if (TT.debugging) {
			new_robot.debug_string = new_robot.toString();
		}
		new_robot = new_robot.add_standard_widget_functionality(new_robot);
        return new_robot;
    };
    
    robot.create_backside = function () {
		return TT.robot_backside.create(this);
	};
    
    robot.copy = function (just_value) {
		var bubble = this.get_bubble();
		var bubble_copy = bubble ? bubble.copy(true) : undefined;
		var next_robot = this.get_next_robot();
		var next_robot_copy = next_robot ? next_robot.copy(just_value) : undefined;
		var copy = this.create(this.get_image_url(), 
		                       bubble_copy,
							   this.get_body().copy(),
							   this.get_description(),
							   this.get_width(),
							   this.get_height(),
							   this.get_run_once(),
							   next_robot_copy);
		if (just_value) {
			return copy;
		}
        return this.add_to_copy(copy);
    };
	
	robot.match = function () {
		console.log("Robot-to-robot matching could be more sophisticated.");
		return "matched";
	};
    
    robot.run = function (context, queue) {
        var match_status, i;
		var bubble = this.get_bubble();
        if (this.stopped) {
            return 'not matched';
        }
		if (!bubble) {
			console.log("Training robots without a context not yet implemented.");
			return 'not matched';
		}
        match_status = bubble.match(context);
        switch (match_status) {
        case 'matched':
            if (!queue) {
                queue = TT.QUEUE;
            }
			this.get_body().reset_newly_created_widgets();
            queue.enqueue({robot: this, context: context, queue: queue});
            return match_status;
        case 'not matched':
            if (this.get_next_robot()) {
                return this.get_next_robot().run(context, queue);
            }
            return match_status;
        default:
			if (!match_status) {
				return 'not matched';
			}
            for (i = 0; i < match_status.length; i += 1) {
                match_status[i].run_when_non_empty(this);
            }
            return match_status;                    
        }
    };
    
    robot.set_stopped = function (new_value) {
        this.stopped = new_value;
    };
    
    robot.run_actions = function(context, queue) {
		if (this.stopped) {
			return false;
		}
        return this.get_body().run(context, queue, this);
    };
	
	robot.picked_up = function (widget, json, is_resource) {
		var path;
		if (is_resource) {
			path = widget; // widget itself is the path -- will be a fresh copy created from JSON
		} else {
			path = TT.path.get_path_to(widget, this);
		}
		if (path) {
			this.get_body().add_step(TT.robot_action.create(path, "pick up"));
		}
		this.set_thing_in_hand(widget);
	};
	
	robot.dropped_on = function (target_widget) {
		var path = TT.path.get_path_to(target_widget, this);
		if (path) {
			this.get_body().add_step(TT.robot_action.create(path, "drop it on"));
		}
		this.set_thing_in_hand(null);
	};
	
	robot.copied = function (widget, widget_copy, picked_up) {
		var path = TT.path.get_path_to(widget, this);
		var step;
		if (path) {
			if (picked_up) {
				step = TT.robot_action.create(path, "pick up a copy");
			} else {
				step = TT.robot_action.create(path, "copy");
			}
			this.get_body().add_step(step, widget_copy);
		}
	};
	
	robot.removed = function (widget) {
		var path = TT.path.get_path_to(widget, this);
		if (path) {
			this.get_body().add_step(TT.robot_action.create(path, "remove"));
		}
	};
	
	robot.edited = function (widget, details) {
		var path = TT.path.get_path_to(widget, this);
		if (path) {
			this.get_body().add_step(TT.robot_action.create(path, "edit", details));
		}
	}
	
	robot.set_erased = function (widget, erased) {
		var path = TT.path.get_path_to(widget, this);
		if (path) {
			this.get_body().add_step(TT.robot_action.create(path, "set_erased", {erased: erased,
			                                                                     toString: erased ? "erase" : "un-erase"}));
		}
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
		this.set_bubble(context.copy(true));
		// use minature image as cursor (if there is one)
		$("div").css({cursor: 'url(' + TT.UTILITIES.cursor_of_image(this.get_image_url()) + '), default'});
	};
	
	robot.training_finished = function () {
		$("div").css({cursor: ''}); // restore cursor
		this.update_display();
		this.get_backside().update_display();
	};
	
	robot.update_display = function() {
		// perhaps this should be moved to widget and number and box updated to differ in the to_HTML part
        var frontside = this.get_frontside();
		var backside = this.get_backside();
		var description = this.get_description() || this.toString();
		var bubble = this.get_bubble();
		var new_first_child, robot_image, thought_bubble, frontside_element, bubble_contents_element, resource_becoming_instance;
        if (!frontside) {
            return;
        }
        frontside_element = frontside.get_element();
        robot_image = this.image();
		if ($(frontside_element).parent(".toontalk-top-level-resource").length > 0 || !bubble) {
			new_first_child = robot_image;
		} else {
			thought_bubble = this.thought_bubble_div();
			new_first_child = document.createElement("div");
			$(new_first_child).css({position: "absolute"});
			new_first_child.appendChild(thought_bubble);
			$(robot_image).css({top: "30%"});
			new_first_child.appendChild(robot_image);
			bubble_contents_element = bubble.get_frontside_element();
			$(bubble_contents_element).addClass("toontalk-thought-bubble-contents");
			thought_bubble.appendChild(bubble_contents_element);
			resource_becoming_instance = frontside_element.firstChild && $(frontside_element.firstChild).is(".toontalk-robot-image");
		}
		// remove what's there first
        while (frontside_element.firstChild) {
            frontside_element.removeChild(frontside_element.firstChild);
        }
		frontside_element.title = description ? "This robot " + description : "This is a " + this.toString();
		$(frontside_element).addClass("toontalk-robot");
		$(new_first_child).addClass("toontalk-widget");
		frontside_element.style.width = this.get_width();
		frontside_element.style.height = this.get_height();
		// following interfered with resizable
// 		$(frontside_element).css({width: this.get_width(),
// 		                          height: this.get_height()});
		frontside_element.appendChild(new_first_child);
		setTimeout( // wait for layout to settle down
			function () {
				if (bubble_contents_element) {
					bubble.update_display();
				}
				if (resource_becoming_instance) {
					// need to adjust for thought bubble
					frontside_element.style.top = ($(frontside_element).position().top - $(robot_image).height()) + "px";
				}
			},
			1);
			if (backside && backside.visible()) {
				backside.update_display();
			}
    };
	
	robot.image = function () {
		var image = document.createElement("img");
		image.src = this.get_image_url(); // causes Caja error
		image.style.width = "100%";
		image.style.height = "70%"; // other part is for thought bubble
		$(image).addClass("toontalk-robot-image");
		return image;	
	};
	
	robot.thought_bubble_div = function () {
		var thought_bubble = document.createElement("div");
		$(thought_bubble).addClass("toontalk-thought-bubble");
		return thought_bubble;
	};
	
	robot.toString = function () {
		var bubble = this.get_bubble();
		var body = this.get_body();
		var bubble_erased;
		if (!bubble || !body || body.is_empty()) {
			return "has yet to be trained";
		}
		bubble_erased = bubble.get_erased() ? " an erased " : " a ";
		return "when working on something that matches" + bubble_erased + bubble.toString() + " will \n" + body.toString();
	};
	
	robot.get_type_name = function () {
		return "robot";
	};
	
	robot.get_json = function () {
		var bubble_json, next_robot_json;
		if (this.get_bubble()) {
			bubble_json = this.get_bubble().get_json();
		}
		if (this.get_next_robot()) {
			next_robot_json = this.get_next_robot().get_json();
		}
		return this.add_to_json(
			{semantic:
				 {type: "robot",
				  bubble: bubble_json,
				  body: this.get_body().get_json(),
				  run_once: this.get_run_once(),
				  next_robot: next_robot_json
				  },
	         view:
			     {image_url: this.get_image_url(),
// 			 width: this.get_width(),
// 			 height: this.get_height(),
			      description: this.get_description()}});
	};
    
    robot.create_from_json = function (json_semantic, json_view) {
		var next_robot, thing_in_hand;
		if (json_semantic.thing_in_hand) {
			thing_in_hand = TT.UTILITIES.create_from_json(json_semantic.thing_in_hand);
		}
		if (json_semantic.next_robot) {
			json_semantic.next_robot = TT.UTILITIES.create_from_json(json_semantic.next_robot);
		}
		return TT.robot.create(json_view.image_url,
		                       TT.UTILITIES.create_from_json(json_semantic.bubble),
		                       TT.UTILITIES.create_from_json(json_semantic.body),
							   json_view.description,
							   json_view.width,
							   json_view.height,
							   thing_in_hand,
							   json_semantic.run_once,
							   next_robot);
	};
    
    return robot;
}(window.TOONTALK));

window.TOONTALK.robot_backside = 
(function (TT) {
    "use strict";
    return {
        create: function (robot) {
	        var backside = TT.backside.create(robot);
			var backside_element = backside.get_element();
            var image_url_input = TT.UTILITIES.create_text_input(robot.get_image_url(), "toontalk-image-url-input", "Image URL&nbsp;", "Type here to provide a URL for the appearance of this robot.");
			var description_input = TT.UTILITIES.create_text_input(robot.get_description() || robot.toString(), 
			                                                       "toontalk-robot-description-input", 
																   "Description&nbsp;",
																   "Type here to provide a better descprion of this robot.");
			var run_once_input = TT.UTILITIES.create_check_box_button(!robot.get_run_once(), 
			                                                          "When finished start again",
																	  "Check this if you want the robot to start over again after finishing what he was trained to do.");
            var input_table;
			var standard_buttons = TT.backside.create_standard_buttons(backside, robot);
			// don't do the following if already trained -- or offer to retrain?
			standard_buttons.insertBefore(this.create_train_button(backside, robot), standard_buttons.firstChild);
			image_url_input.button.onchange = function () {
				var image_url = image_url_input.button.value.trim();
                robot.set_image_url(image_url, true);
				if (TT.robot.in_training) {
					TT.robot.in_training.edited(robot, {setter_name: "set_image_url",
			                                            argument_1: image_url,
												        toString: "change the image URL to " + image_url + " of the robot"});
				}
            };
			description_input.button.onchange = function () {
				var description = description_input.button.value.trim();
                robot.set_description(description, true);
				if (TT.robot.in_training) {
					TT.robot.in_training.edited(robot, {setter_name: "set_description",
			                                            argument_1: description,
												        toString: "change the description to '" + description + "'' of the robot"});
				}
            };
			$(run_once_input.button).click(function (event) {
				var keep_running = run_once_input.button.checked;
				robot.set_run_once(!keep_running);
				if (TT.robot.in_training) {
					TT.robot.in_training.edited(robot, {setter_name: "set_run_once",
			                                            argument_1: !keep_running,
												        toString: "change to " + (keep_running ? "run again" : "run once") + " of the robot"});
				}
				event.stopPropagation();
			});
			input_table = TT.UTILITIES.create_vertical_table(description_input.container, image_url_input.container, run_once_input.container);
			$(input_table).css({width: "90%"});
			backside_element.appendChild(input_table);
			backside_element.appendChild(standard_buttons);
			backside.update_display = function () {
				var title = robot.get_description() || robot.toString();
				$(description_input.button).val(title);
				$(image_url_input.button).val(robot.get_image_url());
				$(run_once_input.button).prop("checked", !robot.get_run_once());
				robot.title = title;
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
						$train_button.attr("title", "Click to stop training this robot.");
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