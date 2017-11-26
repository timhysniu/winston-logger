"use strict";

const winston = require('winston');
const util = require('util');
const moment = require('moment');
const colour = require('colour');

/**
 * Winston appender that creates colorized log output
 * in the console.
 */
class ConsoleAppender extends winston.transports.Console {

    constructor(config) {

        config.timestamp = () => {
            return new Date();
        };

        config.formatter = (options) => {

            options.meta = options.meta || {};

            let level = options.level;

            // format correlation id
            let correlationId = '';
            if(options.meta['correlation_id']) {
                correlationId = `[correlation id: ${options.meta['correlation_id'].blue}]`;
                delete options.meta['correlation_id'];
            }

            // format url
            if(options.meta.request && options.meta.request.path) {
                options.message = options.message.blue;
            }


            let indent = !config.stringify && (level === 'error' || level == 'request') ? 2 : 0;
            let data = JSON.stringify(options.meta, null, indent);
            if(data) {
                data = ':: data: ' + data;
            }

            return util.format("%s [%s] :: %s %s %s",
                moment().format(),
                level[options.level],
                options.message,
                correlationId,
                data);
        };

        super(config);

        colour.setTheme({
            info: 'green',
            warn: 'yellow',
            debug: 'blue',
            error: 'red',
        });
    }

}


module.exports = ConsoleAppender;