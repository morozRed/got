/**
 * TODO: deal with expired ttl`s and capacity   
 */
module.exports = options => {
    this.capacity = options.capacity || 1000;
    this.storage = {};

    this.get = function(key) {
        return this.storage[key];
    }

    this.getAll = function() {
        return Object.values(this.storage);
    }

    this.set = function(key, record) {
        this.storage[key] = record;
    }

    this.update = function(key, params) {
        return Object.assign(this.storage[key], params);
    }

    return this;
}