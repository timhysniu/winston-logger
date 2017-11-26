'use strict';

module.exports = (type) => {

    let logger = type ? `plugins/${type}/logger` : 'logger';
    let context = type ? `plugins/${type}/context` : 'context';

    return {
        Logger: require(`./lib/${logger}`),
        Context: require(`./lib/${context}`)
    };
};

