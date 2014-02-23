 /**
 * Implements ToonTalk's conditions for running robots, e.g. a thought bubble
 * Authors: Ken Kahn
 * License: New BSD
 */

window.TOONTALK.condition = 
(function(TT) {
    "use strict";
    return {
        create: function(items) {
            "use strict";
            // items can be a single primitive or a backside
            var result = Object.create(this);
            result.items = items;
            return result;
        },
        
        copy: function() {
            "use strict";
            // copy items?
            return this.create(this.items);
        },
        
        match: function(context) {
            "use strict";
            return this.items.match(context);
        }
        
    };
}(window.TOONTALK));