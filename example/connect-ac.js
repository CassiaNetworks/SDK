var co = require('co');
var {AC} = require('../api');

var AP_MAC = 'CC:1B:E0:E0:04:B4';

co(function *() {
  var ac = new AC('192.168.0.227');
  yield ac.auth('tester', '10b83f9a2e823c47');

  var routers = yield ac.getAllRouters();
  console.log(routers);

  var locs = yield ac.getLocationByRouter();
  console.log(locs);
  var r = ac.getRouter(AP_MAC);
  yield r.scan();
  r.on('scan', (d) => {
    // console.log(d);
  });
  r.on('error', (e) => {
    console.log(e);
  });
}).catch((e) => {
  console.log(e);
});

