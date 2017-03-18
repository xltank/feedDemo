/**
 * Created by JasonXu on 2017/3/18.
 */
"use strict";

let log4js = require('log4js');

let config = {
    appenders: [
        {
            type: "console"
        },
        {
            type: "logLevelFilter",
            level: "ALL",
            appender: {
                type: "file",
                filename: "/var/log/feed/out.log"
            }
        },
        {
            type: "logLevelFilter",
            level: "ERROR",
            appender: {
                type: "file",
                filename: "/var/log/feed/err.log"
            }
        }
    ],
    replaceConsole: true
};

log4js.configure(config);

module.exports = function(categoryName){
        return log4js.getLogger(categoryName);
    };