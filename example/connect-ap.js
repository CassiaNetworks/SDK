// import {Gateway, AC} from '../api.js'; // ES6 import
const {Gateway} = await import('../api.js'); // CommonJS
var IP = '<ip>';

async function main() {
    var r = new Gateway(IP);  
    var list = await r.getConnectedDevices();
    console.log('connected device list', list);
    let scanSource = await r.scan({active:1});
    r.on('scan', (d) => {
        console.log(d);
    });
    // you can stop scan use scanSource.close();
    await r.listenNotify();
    r.on('notify', (d) => {
        console.log(d);
    });
    r.on('error', (e) => {
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