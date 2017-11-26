"use strict";
const _ = require('lodash');
const Context = require('../../context');

class ContextHapi extends Context {

    constructor(request) {

        var data = {
            correlationId: request.headers['correlation_id'] || null,
            fulfillmentId: request.headers['user_id'] || null,
            version: request.headers['version'] || null,
            serviceId: request.headers['service'] || null,
            host: request.headers['host'] || null,
        };

        super(data);

        this.requestData = this._setRequestData(request)
    }

    _setRequestData(request) {
        let out = {
            'method': request.method.toUpperCase(),
            'path': request.url.path
        };

        if(request.payload) {
            out.payload = request.payload;
        }

        let resp = request.response;
        if(resp) {
            out.response = {};

            // check for application errors
            if(resp.source && resp.source.status_code) {
                out.response.status_code =  resp.source.status_code;

                if(resp.source.meta) {
                    let origMeta = resp.source.meta;
                    out.response.meta = _.cloneDeep(origMeta);
                    if(origMeta.errors && origMeta.errors.length > 0) {
                        this.errors = origMeta.errors;
                        delete out.response.meta.errors;
                    }
                    else if(resp.source.status_code === 500) {
                        this.errors = [{
                            message: origMeta.message,
                            timestamp: origMeta.timestamp
                        }]
                    }
                }
            }

            // check for hapi errors
            let statusCode = _.get(resp, 'output.statusCode', null);
            if(statusCode && parseInt(statusCode) >= 400) {
                out.response.status_code = statusCode;
                let details = _.get(resp, 'data.details', []);
                if(details.length > 0) {
                    details[0].code = statusCode;
                    this.errors = details;

                    out.response.meta = {
                        success: false,
                        error: _.get(resp, 'output.payload.error', 'Unknown error'),
                        message: _.get(resp, 'output.payload.message', 'Unknown error'),
                    }
                }
            }

        }

        return out;
    }

}


module.exports = ContextHapi;