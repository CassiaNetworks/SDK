var {AC} = require('../api');

(async function () {
  var ac = new AC('192.168.0.226');
  await ac.auth('cassia', '1q2w#E$R');

  var gateways = await ac.getAllGateways();
  console.log(gateways);

  let gateway = ac.getGateway(gateways[0].mac);
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

