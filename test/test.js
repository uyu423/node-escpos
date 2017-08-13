const escpos = require('..');
const assert = require('assert');

describe('ESC/POS printing test', () => {
  it('device#write', (done) => {
    const device = new escpos.Console(((data) => {
      assert.equal(data.length, 3);
      done();
    }));
    device.write(new Buffer(3));
  });

  it('printer#print', (done) => {
    const device = new escpos.Console(((data) => {
      assert.deepEqual(data, new Buffer('hello world'));
      done();
    }));
    const printer = new escpos.Printer(device);
    printer.print('hello world').flush();
  });
});
