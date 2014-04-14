// Core libraries we will use:
var util = require('util');
var Stream = require('stream');
var Buffer = require('buffer').Buffer;

/*
 * A Readable stream for a string or Buffer.
 *
 * This works for both strings and Buffers.
 */
function StringReader(str) {
  this.data = str;
}

// Make StringReader a Stream.
util.inherits(StringReader, Stream);

module.exports = StringReader;

/*
 * This is more important than it may look. We are going to 
 * create a "stream" that is "paused" by default. This gives
 * us plenty of opportunity to pass the reader to whatever
 * needs it, and then `resume()` it.
 *
 * This will do the following things:
 * - Emit the (entire) string or buffer in one chunk.
 * - Emit the `end` event.
 * - Emit the `close` event.
 */
StringReader.prototype.resume = function () {
  // If the data is a buffer and we have an encoding (from setEncoding)
  // then we convert the data to a String first.
  if (this.encoding && Buffer.isBuffer(this.data)) {
    this.emit('data', this.data.toString(this.encoding));
  }
  // Otherwise we just emit the data as it is.
  else {
    this.emit('data', this.data);
  }
  // We emitted the entire string, so we can finish up by
  // emitting end/close.
  this.emit('end');
  this.emit('close');
}

/*
 * Set the encoding.
 * 
 * This is used for Buffers.
 */
StringReader.prototype.setEncoding = function (encoding) {
  this.encoding = encoding;
}

/*
 * This is here for API completeness, but it does nothing.
 */
StringReader.prototype.pause = function () {
}

/*
 * This is here for API completeness.
 */
StringReader.prototype.destroy = function () {
  delete this.data;
}

module.exports =  StringReader;