var co = require('co');
var {Router} = require('../api');
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
