const {Gateway} = require('../api');
const IP = '<Gateway IP>';

(async function() {
    const gateway = new Gateway(IP);
    const list = await gateway.getConnectedDevices();
    console.log(list);
    const es = await gateway.scan({active: 1});
    gateway.on('scan', (d) => {
        console.log(d);
    });
    setTimeout(() => {
        es.close();
    }, 10000);
    // you can stop scan use es.close();
    await gateway.listenNotify();
    gateway.on('notify', (d) => {
        console.log(d);
    });
    gateway.on('error', (e) => {
        console.log('emit error', e);
    });
})().catch((e) => {
    console.log('catch error', e);
});
