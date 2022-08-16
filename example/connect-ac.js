// import {Gateway, AC} from '../api.js'; // ES6 import
const {AC} = await import('../api.js'); // CommonJS
const AC_IP = '<ac_ip>';
const AC_USER = '<user>';
const AC_PASS = '<pass>';
var GATEWAY_MAC = '<gateway_mac>';

async function main() {
    var ac = new AC(AC_IP);
    await ac.auth(AC_USER, AC_PASS);

    var gateway = ac.getGateway(GATEWAY_MAC);
    var info = await gateway.info();
    console.log('get info', info);

    await gateway.info({name: "test name"});

    var list = await gateway.getConnectedDevices();
    console.log('connected device list', list);

    let scanSource = await gateway.scan({active:1});// you can stop scan with "scanSource.close();"
    gateway.on('scan', (d) => {
        console.log('scan data', d);
    });

    await gateway.listenNotify();
    gateway.on('notify', (d) => {
        console.log(d);
    });
    gateway.on('error', (e) => {
        console.log('emit error', e);
    });
}

(async function() {
    try {
        await main();
    }catch(e) {
        console.error(e);
    }
})();
