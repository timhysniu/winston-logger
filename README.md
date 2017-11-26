
### Table of Contents

- [Features](#features)
- [Install](#install)
- [Usage](#usage)

### Features

- Logger library using [Winston](https://github.com/winstonjs/winston/tree/2.x)
- Supports Console and Splunk transports
- Can extend to format logs your framework or application (Hapi)
- Colorized and pretty print logs for console
- Ability to log requests and response code
- Support for logging levels: error, warn, info, debug

### Initialization

```js

var Logger = require('winston-logger')().Logger;

// initialize standard out logger in json format
var config = {
    level: 'info',
    format: 'json',
    stringify: true,
    service: 'project-name'
};

var logger = new Logger(config);

```

For development environment use `Console` as format to make use of color coding
and pretty print for errors:
```js
var Logger = require('winston-logger')().Logger;

var config = {
  "format": "console",
  "stringify": true,
  "level": "debug",
  "service": "my-project",
}

var logger = new Logger(config);
```

You may also send logs directly to Splunk. To initialize ensure you have all relevant
Splunk config options and token:

```js
var Logger = require('winston-logger')().Logger;

var config = {
  "format": "splunk",
  "stringify": true,
  "level": "info",
  "service": "my-project",
  "splunk": {
    "token": "12345678-1234-5678-1234-123456789012",
    "host": "splunk-hostname",
    "port": "8088",
    "path": "/services/collector/event",
    "protocol": "https",
    "source": "splunk-logger",
    "sourcetype": "my-project",
    "maxRetries": 3,
    "maxBatchCount": 50       // default is 20
  }
}
```

###### Configuration Options

- *level*: error, warn, info, or debug
- *format*
    - *json*: winston.transports.Console transport in JSON format
    - *console*: winston.transports.Console transport with colorized output for development
- *stringify*: *true* will stringify to one line, otherwise its pretty json format
- *service*: service identifier used to identify the origin of this log (eg. my-project-name)
- *splunk*: If Splunk format is used then splunk config options go here. See example above.

### General Usage

```
// error
logger.log('error', 'error message here', { item1: 1, item2: 2 }); // error
logger.error('error message here', { item1: 1, item2: 2 }); // error

// warning
logger.log('warn', 'error message here', { item1: 1, item2: 2 });
logger.warn('warning message here', { item1: 1, item2: 2 });

// info
logger.log('info', 'error message here', { item1: 1, item2: 2 });
logger.info('info message here', { item1: 1, item2: 2 });

// debug
logger.log('debug', 'error message here', { item1: 1, item2: 2 });
logger.debug('debug message here', { item1: 1, item2: 2 });

```


### Using with Hapi

In order to use this with hapi use the hapi extension instead:
```js
var Logger = require('winston-logger')('hapi').Logger;

// using a singleton logger
var logger = new Logger( ... );
server.logger = logger;
```

Then you may initialize the as described above.
You may want to log requests and response codes when you are using this with Hapi.
To do that you can add a hapi plugin and use `logRequest` which handles log format for you.

```js
exports.register = function (server, options, next) {
    server = server.root;

    server.ext({
        type: 'onPreResponse',
        method: function (request, reply) {
            server.logger.logRequest(request);

            return reply.continue();
        }
    });

    next();
};

exports.register.attributes = {
    name: 'app-request-logger',
    version: '1.0.0'
};
```


#### Using Context in Hapi

The purpose of using *context* is to be able to correlate internal logs just like we
use correlation ID to correlate logs externally. Each hapi request will have a *context*
that can be passed along log calls. This starts at the route level:

*Route file*:
```
var Context = require('winston-logger')('hapi').Context;

server.route({
    method: 'GET',
    path: '/api/v1/user/{user_id}',
    config: {

        // ...

        handler: function (request, reply) {

            // This creates a context object using the response headers in request.
            // We can then pass this context to our application/data layer and
            // to all outbound calls.
            var context = new Context(request);

            // Pass in the context
            self.services.user.get(request.params.contact_id, context)
                .then(function (results) {

                    // And you can pass context to log calls too when we want
                    // to ensure context variables are in the log
                    server.logger.log('error', 'testing context', {a:1}, context);

                    self.handleResponse(request, reply, results);
                })
                .catch(function (err) {
                    self.handleError(request, reply, err, context);
                });
        }
    }
});
```

### Adding Your Own Custom Extensions

Send a pull request and add your own extension.



*User.js*
```
    self.get = function (user_id, context) {
        return new Promise(function (resolve, reject) {
            logger.log('info', 'There was an error with user', {user_id}, context);
        });
    };
```

When providing the context logger will append the following to the log, provided they are in the request headers:
- correlation_id
- service
- version
- level
- message
- timestamp

correlation_id will be used to correlate requests across different microservices.

All additional metadata passed in above will be added to custom_data object.
The following is an example of how this log looks like in json:

```
{
  "service": "my-project",
  "version": "eb823fc",
  "timestamp": "2018-01-08T18:18:18.888Z",
  "level": "info",
  "correlation_id": "f4e42a7e-7f56-4a18-b5ff-ec9e367cfa81",
  "custom_data": {
    "user_id": "1234"
  }
}

```


