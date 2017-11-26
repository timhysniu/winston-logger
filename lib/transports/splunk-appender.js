
var _ = require('lodash');
var util = require('util');
var winston = require('winston');
var SplunkLogger = require('splunk-logging').Logger;

const getMessage = (context) => {
    var msg = context.message && context.message.message ?
        context.message.message : '';
    return msg;
}

var SplunkAppender = function (config) {
    winston.Transport.call(this, config);

    /** @property {string} name - the name of the transport */
    this.name = 'SplunkAppender';

    /** @property {string} level - the minimum level to log */
    this.level = config.level || 'info';

    // Verify that we actually have a splunk object and a token
    if (!config.splunk || !config.splunk.token) {
        throw new Error('Invalid Configuration: options.splunk is invalid');
    }

    // If source/sourcetype are mentioned in the splunk object, then store the
    // defaults in this and delete from the splunk object
    this.defaultMetadata = {
        source: 'winston',
        sourcetype: 'winston-splunk-logger'
    };

    if (config.splunk.source) {
        this.defaultMetadata.source = config.splunk.source;
        delete config.splunk.source;
    }

    if (config.splunk.sourcetype) {
        this.defaultMetadata.sourcetype = config.splunk.sourcetype;
        delete config.splunk.sourcetype;
    }

    // This gets around a problem with setting maxBatchCount
    config.splunk.maxBatchCount = config.splunk.maxBatchCount || 1;
    this.server = new SplunkLogger(config.splunk);

    // Override the default event formatter
    if (config.splunk.eventFormatter) {
        this.server.eventFormatter = config.splunk.eventFormatter;
    }
};

util.inherits(SplunkAppender, winston.Transport);

/**
 * Returns the configuration for this logger
 * @returns {Object} Configuration for this logger.
 * @public
 */
SplunkAppender.prototype.config = function () {
    return this.server.config;
};

/**
 * Core logging method exposed to Winston.
 *
 * @function log
 * @member SplunkAppender
 * @param {string} level - the level at which to log the message
 * @param {string} msg - the message to log
 * @param {object} [meta] - any additional meta data to attach
 * @param {function} callback - Continuation to respond to when complete
 */

SplunkLogger.prototype.sendLog = function(context, callback) {
    context = this._initializeContext(context);

    // Store the context, and its estimated length
    var eventObj = this._makeBody(context);
    var meta = _.cloneDeep(eventObj.event.message) || {};

    delete eventObj.event.message;

    Object.keys(meta).forEach((key) => {
        eventObj.event[key] = meta[key];
    });

    eventObj.event.message = getMessage(eventObj.event);

    var currentEvent = JSON.stringify(eventObj);

    this.serializedContextQueue.push(currentEvent);
    this.eventsBatchSize += Buffer.byteLength(currentEvent, "utf8");

    var batchOverSize = this.eventsBatchSize > this.config.maxBatchSize && this.config.maxBatchSize > 0;
    var batchOverCount = this.serializedContextQueue.length >= this.config.maxBatchCount && this.config.maxBatchCount > 0;

    // Only flush if the queue's byte size is too large, or has too many events
    if (batchOverSize || batchOverCount) {
        this.flush(callback || function(){});
    }
};

SplunkAppender.prototype.log = function (level, msg, meta, callback) {

    meta.message = msg;

    var self = this;
    var payload = {
        message: meta,
        metadata: {
            source: this.defaultMetadata.source,
            sourcetype: this.defaultMetadata.sourcetype
        },
        severity: level
    };

    this.server.sendLog(payload, function (err) {
        if (err) {
            self.emit('error', err);
        }
        self.emit('logged');
        callback(null, true);
    });
};

// Insert this object into the Winston transports list
winston.transports.SplunkAppender = SplunkAppender;

// Export the Winston transport
module.exports = exports = winston.transports.SplunkAppender;