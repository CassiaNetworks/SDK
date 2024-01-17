var {Gateway} = require('../api');
var IP = '10.100.93.130';

(async function () {
  var gateway = new Gateway(IP);
  var list = await gateway.getConnectedDevices();
  console.log(list);
  let es = await gateway.scan({active:1});
  gateway.on('scan', (d) => {
    console.log(d);
  });
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
