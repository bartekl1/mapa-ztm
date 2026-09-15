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
    addChangeListener(key, func) {
        this.values[key].listeners.push(func);
    }
    setValue(key, value) {
        this.values[key].value = value;
        this.values[key].listeners.forEach(listener => { listener({key: key, newValue: value}); });
    }
}
