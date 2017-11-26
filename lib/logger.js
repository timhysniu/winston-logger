'use strict';

const winston = require('winston');
const colorize = require('colorize');
const _ = require('lodash');
const ConsoleAppender = require('./transports/console-appender');
const SplunkAppender = require('./transports/splunk-appender');

/**
 * Logging wrapper of winston with selected transports.
 * Uses hapi extension points to log requests and response codes.
 * Uses request context to append context variables to log data
 */
class Logger {
    constructor(config) {

        let self = this;
        self.transport = null;

        let options = Object.assign({}, config);
        options.format = options.format || 'console';

        // developers only output
        if(options.format === 'console') {
            options.handleExceptions = options.handleExceptions || true;
            options.level = config.level || 'debug';
            options.json = false;
            options.colorize = true;
            options.exitOnError = false;

            self.transport = new ConsoleAppender(options);
        }
        // JSON formatted to Splunk
        else if(options.format === 'splunk') {
            options.level = config.level || 'info';
            options.json = true;

            self.transport = new SplunkAppender(options);
        }
        // JSON formatted to standard out
        else {
            options.level = options.level || 'info';
            options.json = true;

            self.transport = new winston.transports.Console(options);
        }

        // initialize winston logger
        this.logger = new winston.Logger({
            transports: [ self.transport ],
            exitOnError: false
        });
    }

    /**
     * Append context data to metadata.
     * This is intended to be overridden
     *
     * @abstract
     * @param meta
     * @param context
     */
    getContextData(meta, context) {
        return meta;
    }

    /**
     * Logs a message to the logger.
     * @param {string} level The log level ('debug', 'info', 'warn', 'error')
     * @param {string} message The message
     * @param {any} meta Optional Metadata about the log message
     */
    log(level, message, meta, context) {
        let data = this.getContextData(meta, context);

        switch(level) {
            case 'error':
                this.logger.error(message, data);
                break;
            case 'warn':
                this.logger.warn(message, data);
                break;
            case 'info':
                this.logger.info(message, data);
                break;
            default:
                this.logger.debug(message, data);
        }
    }

    /**
     * Logs an error message
     * @param {string} message
     * @param {any} meta
     */
    error(message, meta, context) {
        this.log('error', message, meta, context);
    }

    /**
     * Logs a warn message
     * @param {string} message
     * @param {any} meta
     */
    warn(message, meta, context) {
        this.log('warn', message, meta, context);
    }

    /**
     * Logs an info message
     * @param {string} message
     * @param {any} meta
     */
    info(message, meta, context) {
        this.log('info', message, meta, context);
    }

    /**
     * Logs a debug message
     * @param {string} message
     * @param {any} meta
     */
    debug(message, meta, context) {
        this.log('debug', message, meta, context);
    }
}

module.exports = Logger;
