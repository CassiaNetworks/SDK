# SDK
Cassia bluetooth SDK, for AC and AP, refer https://cassiasdk.docs.apiary.io

# Installation
``` npm i https://github.com/CassiaNetworks/node-cassia-sdk.git --save ```


# Sample
```javascript
var co = require('co');
var {Router} = require('node-cassia-sdk');
var IP = '192.168.0.38';

co(function *() {
  var r = new Router(IP);  
  var list = yield r.getConnectedDevices();
  console.log(list);
  let es = r.scan({active:1});
  r.on('scan', (d) => {
    console.log(d);
  });
  // you can stop scan use es.close();
  yield r.listenNotify();
  r.on('notify', (d) => {
    console.log(d);
  });
  r.on('error', (e) => {
    console.log('emit error', e);
  });
}).catch((e) => {
  console.log('catch error', e);
});
```