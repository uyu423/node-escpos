
const os = require('os');
const usb = require('usb');
const util = require('util');
const EventEmitter = require('events');

/**
 * [USB Class Codes ]
 * @type {Object}
 * @docs http://www.usb.org/developers/defined_class
 */
const IFACE_CLASS = {
  AUDIO: 0x01,
  HID: 0x03,
  PRINTER: 0x07,
  HUB: 0x09,
};

/**
 * [function USB]
 * @param  {[type]} vid [description]
 * @param  {[type]} pid [description]
 * @return {[type]}     [description]
 */
function USB(vid, pid) {
  EventEmitter.call(this);
  const self = this;
  this.device = null;
  if (vid && pid) {
    this.device = usb.findByIds(vid, pid);
  } else {
    const devices = USB.findPrinter();
    if (devices && devices.length) { this.device = devices[0]; }
  }
  if (!this.device) { throw new Error('Can not find printer'); }

  usb.on('detach', (device) => {
    if (device == self.device) {
      self.emit('detach', device);
      self.emit('disconnect', device);
      self.device = null;
    }
  });
  return this;
}

/**
 * [findPrinter description]
 * @return {[type]} [description]
 */
USB.findPrinter = function () {
  return usb.getDeviceList().filter((device) => {
    try {
      return device.configDescriptor.interfaces.filter(iface => iface.filter(conf => conf.bInterfaceClass === IFACE_CLASS.PRINTER).length).length;
    } catch (e) {
      // console.warn(e)
      return false;
    }
  });
};

/**
 * make USB extends EventEmitter
 */
util.inherits(USB, EventEmitter);

/**
 * [open usb device]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
USB.prototype.open = function (callback) {
  let self = this,
    counter = 0,
    index = 0;
  this.device.open();
  this.device.interfaces.forEach((iface) => {
    (function (iface) {
      iface.setAltSetting(iface.altSetting, function () {
        // http://libusb.sourceforge.net/api-1.0/group__dev.html#gab14d11ed6eac7519bb94795659d2c971
        // libusb_kernel_driver_active / libusb_attach_kernel_driver / libusb_detach_kernel_driver : "This functionality is not available on Windows."
        if (os.platform() !== 'win32') {
          if (iface.isKernelDriverActive()) {
            try {
              iface.detachKernelDriver();
            } catch (e) {
              console.error('[ERROR] Could not detatch kernel driver: %s', e);
            }
          }
        }
        iface.claim(); // must be called before using any endpoints of this interface.
        iface.endpoints.filter((endpoint) => {
          if (endpoint.direction == 'out' && !self.endpoint) {
            self.endpoint = endpoint;
          }
        });
        if (self.endpoint) {
          self.emit('connect', self.device);
          callback && callback(null, self);
        } else if (++counter === this.device.interfaces.length && !self.endpoint) {
          callback && callback(new Error('Can not find endpoint from printer'));
        }
      });
    }(iface));
  });
  return this;
};

/**
 * [function write]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
USB.prototype.write = function (data, callback) {
  this.emit('data', data);
  this.endpoint.transfer(data, callback);
  return this;
};

USB.prototype.close = function (callback) {
  this.emit('close', this.device);
  this.device.close(callback);
  return this;
};

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = USB;
