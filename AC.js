const Gateway = require('./Gateway');
const debug = require('debug')('cassia-ac');

class AC extends Gateway {
    constructor(options) {
        super(options);
        if (!this.address.endsWith('api') || !this.address.endsWith('api/')) {
            this.address = this.address + '/api';
        }
    }

    /**
     * auth using developer key and secret in setting page
     * @param {*} developer
     * @param {*} secret
     * @param {*} autoRefresh auto refresh token before it expires
     * @returns
     */
    auth(developer, secret, autoRefresh=true) {
        return this.req({url: '/oauth2/token',
            method: 'POST',
            auth: {
                user: developer,
                pass: secret,
            },
            body: {
                grant_type: 'client_credentials',
            },
        }).then((authinfo) => {
            const token = authinfo['access_token'];
            const expires = authinfo['expires_in'];
            debug('auth result', authinfo);
            this.headers.Authorization = 'Bearer ' + token;
            if (autoRefresh) {
                setTimeout(this.auth.bind(this, developer, secret, true), (expires - 10) * 1000);
            }
        });
    }

    /**
   * get gateway object to call restful api via AC
   * @param {String} mac gateway mac
   */
    getGateway(mac) {
        this.qs.mac = mac;
        return new Gateway({
            address: this.address,
            qs: this.qs,
            headers: this.headers,
            mode: 'ac-managed',
        });
    }

    getAllGateways() {
        return this.req('/ac/ap');
    }

    /**
   * @return {Object} an instance of EventSource
   * */
    gatewayStatus() {
        return this.sse('/cassia/hubStatus');
    }
    /**
   * @param gatewayMac gateway mac, optional
   * @return position by gateway *
   **/
    getLocationByGateway(gatewayMac) {
        if (gatewayMac) {
            return this.req(`/middleware/position/by-ap/${gatewayMac}`);
        } else {
            return this.req('/middleware/position/by-ap/*');
        }
    }
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

    getOnlineGateways() {
        return this.req('/ac/ap').then((gateways) => gateways.filter((g) => g.status == 'online'));
    }

    /**
   * enable or disable gateway auto-selection feature
   * @param _switch - switch
   * @return http response body
   */
    apsSelectionSwitch(_switch=true) {
        return this.req({
            url: '/aps/ap-select-switch',
            method: 'POST',
            body: {
                flag: _switch ? 1 : 0,
            },
        });
    }

    /**
   * connect device by auto-selecting one gateway
   * @param {*} aps gateways' list(MAC)
   * @param {*} devices devices' list(now only support one device)
   * @return http response body
   */
    apsSelectionConnect(aps, devices) {
        return this.req({
            url: '/aps/connections/connect',
            method: 'POST',
            body: {
                aps: aps,
                devices: devices,
            },
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
                devices: devices,
            },
        });
    }

    /**
   * create one combined SSE connection
   * @return {Object} an instance of EventSource
   */
    apsEvents() {
        return this.sse('/aps/events').then((es) => {
            es.on('message', (msg) => {
                if (msg.data.match('keep-alive')) return;
                try {
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

    /**
   *
   * @param {*} type firmware type, can be 'router' or 'container'
   * @returns
   */
    getFirmwares(type) {
        if (type == 'gateway') type = 'router'; // compatible name
        return this.req({
            url: '/ac/firmware',
            method: 'GET',
        }).then((firmwares) => firmwares['firmware'][type]);
    }

    upgradeGateway(mac, targetVersion) {
        return this.getFirmwares('gateway').then((firmwares) => {
            const targetFirmware = firmwares.filter((f) => f.version == targetVersion);
            if (targetFirmware.length == 0) {
                throw new Error('target version not found');
            }
            return targetFirmware[0].id;
        }).then((firmwareId) => {
            return this.req({
                url: `/ac/ap/${mac}/upgrade`,
                method: 'POST',
                body: {mac: mac, firmware: firmwareId},
            });
        });
    }

    installContainer(mac, targetVersion) {
        return this.getFirmwares('container').then((firmwares) => {
            const targetFirmware = firmwares.filter((f) => f.version == targetVersion);
            if (targetFirmware.length == 0) {
                throw new Error('target version not found');
            }
            return targetFirmware[0];
        }).then((firmware) => {
            return this.req({
                url: `/cassia/container/ac_install`,
                qs: {mac},
                method: 'POST',
                body: {
                    'operation': 'download',
                    'imgfile': firmware.path,
                    'imgsize': firmware.size,
                    'imgurl': `http://use_ac_pub_ip/firmware/download/${firmware.id}/container`},
            });
        });
    }

    installContainerApp(mac, targetVersion) {
        return this.getFirmwares('app').then((firmwares) => {
            const targetFirmware = firmwares.filter((f) => f.version == targetVersion);
            if (targetFirmware.length == 0) {
                throw new Error('target version not found');
            }
            return targetFirmware[0];
        }).then((firmware) => {
            return this.req({
                url: `/cassia/container/app/ac_install`,
                qs: {mac},
                method: 'POST',
                body: {
                    'name': firmware.version,
                    'operation': 'download',
                    'pkgname': firmware.path,
                    'pkgsize': firmware.size,
                    'pkgurl': `http://use_ac_pub_ip/firmware/download/${firmware.id}/app`,
                },
            });
        });
    }

    /**
     * discover new gateways
     * @returns
     */
    discoverGateways() {
        return this.req({
            url: '/ac/ap-discover',
            method: 'GET',
        }).then((gateways) => {
            gateways.pop(); // the last element is the number left for license
            return gateways;
        });
    }

    /**
     * add gateway to ac
     * @param {*} name gateway's name
     * @param {*} mac gateway's MAC
     * @returns
     */
    addGateway(name, mac) {
        return this.req({
            url: '/ac/ap',
            method: 'POST',
            body: {name, mac},
        });
    }

    export(fields, path) {
        return this.reqFile({url: '/ac/setting/export/all?fields=' + fields.join(','), json: false}, path);
    }

    statistics(item, from, to) {
        return this.req({
            url: `/ac/stats/${item}/${from}/${to}/query`,
        });
    }

    dashboard(type) {
        return this.req({
            url: `/ac/dashboard/${type}`,
        });
    }

    apiStatus(query) {
        return this.req({
            url: `/v2/status`,
            qs: query || '',
        });
    }
}

module.exports = AC;
