
const util = require('util');
const EventEmitter = require('events');
const SerialPort = require('serialport');

/**
 * SerialPort device
 * @param {[type]} port
 * @param {[type]} options
 */
function Serial(port, options) {
  const self = this;
  options = options || {
    baudrate: 9600,
    autoOpen: false,
  };
  this.device = new SerialPort(port, options);
  this.device.on('close', () => {
    self.emit('disconnect', self.device);
    self.device = null;
  });
  EventEmitter.call(this);
  return this;
}

util.inherits(Serial, EventEmitter);

/**
 * open deivce
 * @param  {Function} callback
 * @return {[type]}
 */
Serial.prototype.open = function (callback) {
  this.device.open(callback);
  return this;
};

/**
 * write data to serialport device
 * @param  {[type]}   buf      [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Serial.prototype.write = function (data, callback) {
  this.device.write(data, callback);
  return this;
};

/**
 * close device
 * @return {[type]} [description]
 */
Serial.prototype.close = function (callback) {
  const self = this;
  this.device.drain((err) => {
    self.device.close();
    self.device = null;
    callback && callback(err, self.device);
  });
  return this;
};

/**
 * expose
 */
module.exports = Serial;
