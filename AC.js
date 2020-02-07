const Router = require('./Router');
const debug = require('debug')('cassia-ac');
const co = require('co');

class AC extends Router {
  constructor(options) {
    super(options);
    if (!this.address.endsWith('api') || !this.address.endsWith('api/')) {
      this.address = this.address + '/api';
    }
  }

  * auth(developer, secret) {
    let authinfo = yield this.req({url: '/oauth2/token',
      method: 'POST',
      auth: {
        user: developer,
        pass: secret,
      },
      body: {
        grant_type: 'client_credentials'
      }
    });
    let token = authinfo['access_token'];
    let expires = authinfo['expires_in'];
    this.headers.Authorization = 'Bearer ' + token;
    setTimeout(() => {
      co(function *(){
        yield auth(developer, secret);
      });
    }, (expires - 10) * 1000);
  }

  /**
   * get router object to call restful api via AC
   * @param {String} mac router mac 
   */
  getRouter(mac) {
    this.qs.mac = mac;
    return new Router({
      address: this.address,
      qs: this.qs,
      headers: this.headers
    });
  }

  * getAllRouters() {
    return yield this.req('/ac/ap');
  }

  /**
   * @return {Object} an instance of EventSource
   * */
  * routerStatus() {
    return yield this.sse('/cassia/hubStatus');
  }
  /**
   * @param routerMac router mac, optional
   * @return position by router *
   **/
  * getLocationByRouter(routerMac) {
    if (routerMac) {
      return yield this.req(`/middleware/position/by-ap/${routerMac}`);
    } else {
      return yield this.req('/middleware/position/by-ap/*');
    }
  };
  /**
   * get Location By Device
   * @param deviceMac - device mac optional
   * @return device positon
   * */
  * getLocationByDevice(deviceMac) {
    if (deviceMac) {
      return yield this.req(`/middleware/position/by-device/${deviceMac}`);
    } else {
      return yield this.req(`/middleware/position/by-device/*`);
    }
  }

  * getOnlineRouters() {
    return yield this.req('/ac/ap');
  }

  /**
   * enable or disable router auto-selection function
   * @param _switch - switch
   * @return http response body
   */
  * apsSelectionSwitch(_switch=true) {
    return yield this.req({
      url: '/aps/ap-select-switch',
      method: 'POST',
      body: {
        flag: _switch ? 1 : 0
      }
    });
  }

  /**
   * connect device by auto-selecting one router
   * @param {*} aps routers' list
   * @param {*} devices devices' list(now only support one device)
   * @return http response body
   */
  * apsSelectionConnect(aps, devices) {
    return yield this.req({
      url: '/aps/connections/connect',
      method: 'POST',
      body: {
        aps: aps,
        devices: devices
      }
    });
  }

  /**
   * disconnect device
   * @param {*} devices devices' list(now only support one device)
   * @return http response body
   */
  * apsSelectionDisconnect(devices) {
    return yield this.req({
      url: '/aps/connections/disconnect',
      method: 'POST',
      body: {
        devices: devices
      }
    });
  }

  /**
   * create one combined SSE connection
   * @return {Object} an instance of EventSource
   */
  * apsEvents() {
    let es = yield this.sse('/aps/events');
    es.on('message', (msg) => {
      if (msg.data.match('keep-alive')) {
        return;
      }
      this.emit('aps-events', JSON.parse(msg.data));
    });
    return es;
  }
}

module.exports = AC;