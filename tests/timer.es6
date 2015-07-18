export default function() {
    var time = 0;
    var updates = [];
    
    return {
        time: function() {
            return time;
        },
        track: function(callback) {
            updates.push(callback);
        },
        advance: function(amount) {
            time += amount;
            updates.forEach(function(update) {
                update();
            });
        }
    };
};
