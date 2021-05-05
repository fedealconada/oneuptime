/* eslint-disable no-console */
/*eslint-disable no-unused-vars*/
import Module from 'module';
const semver = require('semver');
import MongooseListener from './listeners/mongoose';
import IncomingListener from './listeners/incomingListener';
import OutgoingListener from './listeners/outgoingListener';
import PerfTimer from './utils/perfTimer';
import HrTimer from './utils/hrTimer';
class PerformanceMonitor {
    #BASE_URL = 'http://localhost:3002/api'; // TODO proper base url config
    #isWindow;
    #apiUrl;
    #appId;
    #nodeVer;
    #nodeUse;
    #start;
    #end;
    constructor(isWindow, options) {
        this.#apiUrl = options.apiUrl;
        this.#appId = options.appId;
        this.#isWindow = isWindow;
        this.#nodeVer = process.versions.node;
        if (semver.satisfies(this.#nodeVer, '>10.0.0')) {
            this.#nodeUse = true;
        } else {
            this.#nodeUse = false;
        }
        if (this.#nodeUse) {
            const perf = new PerfTimer(this.#apiUrl, this.#appId);
            const { start, end } = perf;
            this.#start = start;
            this.#end = end;
        } else {
            const hrt = new HrTimer(this.#apiUrl, this.#appId);
            const { start, end } = hrt;
            this.#start = start;
            this.#end = end;
        }
        if (!this.#isWindow) {
            this._setUpOutgoingListener();
            this._setUpDataBaseListener();
            this._setUpIncomingListener();
        }
    }
    _setUpOutgoingListener() {
        return new OutgoingListener(this.#start, this.#end);
    }
    _setUpDataBaseListener() {
        const load = Module._load;
        const _this = this;
        Module._load = function(request, parent) {
            const res = load.apply(this, arguments);
            if (request === 'mongoose') {
                const mongo = new MongooseListener(_this.#start, _this.#end);
                return mongo._setUpMongooseListener(res);
            }
            return res;
        };
    }
    _setUpIncomingListener() {
        return new IncomingListener(this.#start, this.#end);
    }
}
export default PerformanceMonitor;