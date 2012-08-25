// Used to emulate optional values, returns val if given and def otherwise
exports.optional = function(val, def) {
    if (typeof val === 'undefined') {
        return def;
    }
    else {
        return val;
    }
};