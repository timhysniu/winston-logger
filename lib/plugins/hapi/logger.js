"use strict";

const _ = require('lodash');
const Logger = require('../../logger');
const Context = require('./context');

class LoggerHapi extends Logger {

    constructor(config) {
        super(config);
    }

    getContextData(meta, context) {
        var data = meta || {};
        if(context && typeof(context) === 'object' && context.constructor.name === 'ContextHapi') {
            data = {
                'version': context.getVersion(),
                'service': context.getServiceId(),
                'host': context.getHost(),
                'correlation_id': context.getCorrelationId(),
                'fulfillment_id': context.getFulfillmentId(),
                'timestamp': new Date()
            };

            let errors = [];
            if(meta && typeof(meta) === 'object' && Object.keys(meta).length > 0) {

                if(meta.type === 'request') {
                    data.request = context.getRequestData();
                    delete meta.type;
                }

                if(Array.isArray(meta.errors) && meta.errors.length > 0) {
                    errors = _.cloneDeep(meta.errors);
                    delete meta.errors;
                }

                if(Object.keys(meta).length > 0) {
                    data.custom_data = meta;
                }
            }

            if(context.hasErrors()) {
                errors = errors.concat(context.getErrors());
            }

            if(errors.length > 0) {
                data.errors = errors;
            }
        }

        return data;
    }


    /**
     * If this is a Hapi request then log it as a request.
     * This is done automatically on onPreResponse extension point
     *
     * @param request
     */
    logRequest(request) {
        if(!request.headers) {
            return;
        }

        let context = new Context(request);
        let level = context.hasErrors() ? 'error' : 'info';

        this.log(level, request.method.toUpperCase() + ' ' + request.url.path, { type: 'request' }, context);
    }

}


module.exports = LoggerHapi;