# SDK
Cassia bluetooth SDK, for AC and AP, refer https://cassiasdk.docs.apiary.io

# Installation
``` npm i https://github.com/CassiaNetworks/node-cassia-sdk.git --save ```


# Sample
```javascript
var {Gateway} = require('node-cassia-sdk');
var IP = '10.100.245.44';

(async function () {
  var gateway = new Gateway(IP);
  var list = await gateway.getConnectedDevices();
  console.log(list);
  let es = gateway.scan({active:1});
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
```