/* global resConf, $log, $app, module, require, $timer, $ws */

//'use strict';

var mylib = {
  cronTestHandler: function (config) {
    var moment = require('moment');
    $log.info("cron task " + config.id + " executed at " + moment().format('YYYY-MM-DD HH:mm:ss'));
  },
  websockets: {
    disconnectEndpoint: function (client, config) {
      return function (data, param) {
        $log.info("websocket client '" + client.id + "' disconnected");
        client.broadcast.emit("test", data);
        client.emit("test", data);
      };
    }
  }
};

module.exports = mylib;