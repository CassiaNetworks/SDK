import {Gateway} from './Gateway.js';
// const debug = require('debug')('cassia-ac');

class AC extends Gateway {
  constructor(options) {
    super(options);
    if (!this.address.endsWith('api') || !this.address.endsWith('api/')) {
      this.address = this.address + '/api';
    }
  }

  auth(developer, secret, autoRefresh=true) {
    return this.req({url: '/oauth2/token',
      method: 'POST',
      username: developer,
      password: secret,
      body: {
        grant_type: 'client_credentials'
      }
    }).then(authinfo => {
      let token = authinfo['access_token'];
      let expires = authinfo['expires_in'];
      this.headers.Authorization = 'Bearer ' + token;
      console.log('get token', token);
      if (autoRefresh) {
        setTimeout(this.auth.bind(this, developer, secret, true), (expires - 10) * 1000);
      }
    });
  }

  /**
   * get router object to call restful api via AC
   * @param {String} mac router mac 
   */
  getGateway(mac) {
    this.qs.mac = mac;
    return new Gateway({
      address: this.address,
      qs: this.qs,
      headers: this.headers
    });
  }

  getAllRouters() {
    return this.req('/ac/ap');
  }

  /**
   * @return {Object} an instance of EventSource
   * */
  routerStatus() {
    return this.sse('/cassia/hubStatus');
  }
  /**
   * @param routerMac router mac, optional
   * @return position by router *
   **/
  getLocationByRouter(routerMac) {
    if (routerMac) {
      return this.req(`/middleware/position/by-ap/${routerMac}`);
    } else {
      return this.req('/middleware/position/by-ap/*');
    }
  };
  /**
   * get Location By Device
   * @param deviceMac - device mac optional
   * @return device positon
   * */
  getLocationByDevice(deviceMac) {
    if (deviceMac) {
      return this.req(`/middleware/position/by-device/${deviceMac}`);
    } else {
      return this.req(`/middleware/position/by-device/*`);
    }
  }

  getOnlineRouters() {
    return this.req('/ac/ap');
  }

  /**
   * enable or disable router auto-selection function
   * @param _switch - switch
   * @return http response body
   */
  apsSelectionSwitch(_switch=true) {
    return this.req({
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
  apsSelectionConnect(aps, devices) {
    return this.req({
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
  apsSelectionDisconnect(devices) {
    return this.req({
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
  apsEvents() {
    return this.sse('/aps/events').then(es => {
      es.on('message', (msg) => {
        if (msg.data.match('keep-alive')) return;
        try{
          this.emit('aps-events', JSON.parse(msg.data));
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
}

// module.exports = AC;
export {AC};