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
   * @return  position by router *
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

  * getStartId() {
    return yield this.req('/start-id');
  }
}

module.exports = AC;