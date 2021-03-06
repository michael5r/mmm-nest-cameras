var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({

    start: function() {
        console.log('Starting node_helper for module [' + this.name + ']');
    },

    socketNotificationReceived: function(notification, payload) {

        if (notification === 'MMM_NEST_CAMERAS_GET') {

            var token = payload.token;
            var url = 'https://developer-api.nest.com/?auth=' + token;
            var self = this;

            request(url, {method: 'GET'}, function(err, res, body) {

                if (res.statusCode === 429) {
                    self.sendSocketNotification('MMM_NEST_CAMERAS_DATA_BLOCKED', err);
                } else if ((err) || (res.statusCode !== 200)) {
                    self.sendSocketNotification('MMM_NEST_CAMERAS_DATA_ERROR', err);
                } else {
                    if (body === {}) {
                        self.sendSocketNotification('MMM_NEST_CAMERAS_DATA_ERROR', 'Token works, but no data was received.<br>Make sure you are using the master account for your Nest.');
                    } else {
                        var data = JSON.parse(body);
                        self.sendSocketNotification('MMM_NEST_CAMERAS_DATA', data);
                    }
                }

            });

        }
    }

});