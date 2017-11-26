"use strict";

class Context {

    constructor(data) {

        var self = this;
        self.errors = null;
        self.correlationId = null;
        self.fulfillmentId = null;
        self.serviceId = null;
        self.version = null;
        self.requestData = null;
        self.host = null;

        data = data || {};

        for (var key in data) {
            self[key] = data[key];
        }
    }

    getCorrelationId() {
        return this.correlationId;
    }

    getFulfillmentId() {
        return this.fulfillmentId;
    }

    getServiceId() {
        return this.serviceId;
    }

    getVersion() {
        return this.version;
    }

    getRequestData() {
        return this.requestData;
    }

    getHost() {
        return this.host;
    }

    hasErrors() {
        return !!this.errors;
    }

    getErrors() {
        return this.errors;
    }
}


module.exports = Context;