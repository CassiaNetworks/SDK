const {AC} = require('../api');
const HOST = '<AC IP>';
const DEV_KEY = '<key>';
const DEV_SECRET = '<secret>';

(async function() {
    const ac = new AC(HOST);
    await ac.auth(DEV_KEY, DEV_SECRET);

    const gateways = await ac.getAllGateways();
    console.log(gateways);

    const gateway = ac.getGateway(gateways[0].mac);
    await gateway.scan();
    gateway.on('scan', (d) => {
        console.log(d);
    });
    gateway.on('error', (e) => {
        console.log(e);
    });
})().catch((e) => {
    console.log(e);
});

