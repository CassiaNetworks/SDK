const EventEmitter = require('events');
const querystring = require('querystring');
const debug = require('debug')('cassia-router');
const EventSource = require('eventsource');
const request = require('request');

/**
 * create a Hub which is a sub class of EventEmitter,
 * it has three builtin events
 *  - notify, will emit when bluetooth device has notify
 *  - scan, will emit when hub has scan data
 *  - connection_state will emit when hub connect or disconnect device
 *  - offline, will emit when hub offline
 *  - error, will emit when some error happen(include offline)
 * @class
 * @param {Object} options {"address":<http address>, "headers":<headers>, "qs":<querystring>}
 * */
class Router extends EventEmitter {
  constructor(options) {
    super();
    options = options || {};
    if (typeof options == 'string') options = {address: options};
    this.address = fixProtocol(options.address);
    this.headers = options.headers || {};
    this.qs = options.qs || {};

    function fixProtocol(address) {
      if (!address.startsWith('http')) {
        address = 'http://' + address;
      }
      return address;
    }
  }

  req(options) {
    if (typeof options == 'string') options = {url: options};
    options.headers = Object.assign({}, this.headers, options.headers);
    options.qs = Object.assign({}, this.qs, options.qs);
    let opts = Object.assign({}, {method: 'GET', baseUrl: this.address, json: true}, options);
    return new Promise((resolve, reject) => {
      request(opts, function(err, response, body) {
        if (err) return reject(err);
        if (response && response.statusCode === 200) {
          return resolve(body);
        } else {
          if (typeof body == 'object') body = JSON.stringify(body);
          return reject(`${response.statusCode} ${body}`);
        }
      })
    })
  }

  sse(options) {
    if (typeof options == 'string') options = {url: options};
    options.headers = Object.assign({}, this.headers, options.headers);
    options.qs = Object.assign({}, this.qs, options.qs, {event:1});
    return new Promise((resolve, reject) => {
      let es = new EventSource(`${this.address}${options.url}?${querystring.stringify(options.qs)}`, {
        headers: options.headers
      });
      es.once('open', () => {
        resolve(es);
      });
      es.once('error', (e) => {
        reject(e);
      });
    });
  }
  
  info() {
    return this.req('/cassia/info');
  }
  /**
   * let the hub start scan, this method will return a EventSource
   * @param {Object} [option]
   * active 1/0
   * filter_name <name1>,<name2>...
   * filter_rssi filter device rssi greater than this value
   * filter_uuid <uuid1>,<uuid2>...
   * @return EventSource
   * */
  scan(options) {
    return this.sse({url: '/gap/nodes', qs: options}).then((es) => {
      es.on('message', (msg) => {
        try {
          this.emit('scan', JSON.parse(msg.data));
        } catch (e) {
          this.emit('error', e);
        }
      });
      es.on('error', (e) => {
        this.emit('error', e);
      });
      return es;
    });
  }

  /**
   * connect device
   * @param {String} deviceMac
   * @param {String} type public/random
   * @param {Integer} timeout in milliseconds
   * */
  connect(deviceMac, type, timeout) {
    return this.req({
      url: `/gap/nodes/${deviceMac}/connection`,
      method: 'POST',
      body: {type: type || 'public', timeout: timeout || 60000}});
  }

  /**
   * disconnect device
   * @param {String} deviceMac
   * */
  disconnect(deviceMac) {
    return this.req({
      url: `/gap/nodes/${deviceMac}/connection`,
      method: 'DELETE'});
  }

  /**
   * write value by handle
   * @param {String} deviceMac
   * @param {String} handle
   * @param {String} value
   * */
  writeByHandle(deviceMac, handle, value, noresponse=false) {
    let url = `/gatt/nodes/${deviceMac}/handle/${handle}/value/${value}`;
    if (noresponse) url = `/gatt/nodes/${deviceMac}/handle/${handle}/value/${value}/?noresponse=1`;
    return this.req({
      url: url,
      method: 'GET'});
  }

  /**
   * write multi values by handle
   * @param {String} deviceMac
   * @param {Object} values [{handle:<handle>, value:<value>}...]
   * */
  writeMulti(deviceMac, values) {
    return values.reduce((chain, current) => {
      return chain.then((last) => {
        return this.writeByHandle(deviceMac, current.handle, current.value);
      });
    });
  }

  /**
   * read by handle
   * @param {String} deviceMac
   * @param {String} handle
   * */
  readByHandle(deviceMac, handle) {
    return this.req({
      url: `/gatt/nodes/${deviceMac}/handle/${handle}/value`,
      method: 'GET'});
  }

  /**
   * @param {String} deviceMac
   * @param {String} [uuid]
   * */
  getCharacteristics(deviceMac, uuid) {
    return this.req({
      url: `/gatt/nodes/${deviceMac}/characteristics`,
      qs: {uuid: uuid},
      method: 'GET'});
  }
  getConnectedDevices() {
    return this.req({url: '/gap/nodes', qs: {'connection_state': 'connected'}});
  }

  listenNotify() {
    return this.sse({url: '/gatt/nodes'}).then((es) => {
      es.on('message', (msg) => {
        try {
          this.emit('notify', JSON.parse(msg.data));
        } catch (e) {
          this.emit('error', e);
        }
      });
      es.on('error', (e) => {
        this.emit('error', e);
      });
      return es;
    })
  }
  listenConnectionState() {
    return this.sse({url: `/management/nodes/connection-state`}).then((es) => {
      es.on('message', (msg) => {
        try{
          this.emit('connection_state', JSON.parse(msg.data));
        } catch (e) {
          this.emit('error', e);
        }
      });
      es.on('error', (e) => {
        this.emit('error', e);
      });
      return es;
    });
  }

  destroy() {
    this.removeAllListeners();
  }
}

module.exports = Router;
