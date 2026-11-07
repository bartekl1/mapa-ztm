export default class Storage {
    constructor() {
        this.values = {};
    }
    createValue(key) {
        this.values[key] = {
            value: undefined,
            listeners: [],
        };
    }
    addChangeListener(key, func, start = false) {
        this.values[key].listeners.push(func);
        if (start) func({key: key, newValue: this.values[key].value});
    }
    setValue(key, value) {
        this.values[key].value = value;
        this.values[key].listeners.forEach(listener => { listener({key: key, newValue: value}); });
    }
    getValue(key) {
        return this.values[key].value;
    }
}
