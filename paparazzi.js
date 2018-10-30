  
  // Paparazzi.js: A MJPG proxy for the masses

  //   paparazzi = new Paparazzi(options)

  //   paparazzi.on "update", (image) => 
  //     console.log "Downloaded #{image.length} bytes"

  //   paparazzi.start()

var EventEmitter, Paparazzi, request,
  boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

request = require('request');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

EventEmitter = require('events').EventEmitter;

Paparazzi = (function() {
  var imageExpectedLength;

  class Paparazzi extends EventEmitter {
    constructor(options) {
      /*
       *
       * Handles chunks of data sent by the server and restore images.
       *
       * A MJPG image boundary typically looks like this:
       * --myboundary
       * Content-Type: image/jpeg
       * Content-Length: 64199
       * \r\n
       *
       */
      this.handleServerResponse = this.handleServerResponse.bind(this);
      if (options.url == null) {
        emitter.emit('error', {
          message: 'URL is not defined!'
        });
      }
    }

    start() {
      var emitter;
      // To use EventEmitter in the callback, we must save our instance 'this'
      emitter = this;
      return request.get(this.options.url, this.options).on('response', function(response) {
        if (response.statusCode !== 200) {
          emitter.emit('error', {
            message: 'Server did not respond with HTTP 200 (OK).'
          });
          return;
        }
        emitter.emit('debug', {
          message: response.headers['content-type']
        });
        emitter.boundary = emitter.boundaryStringFromContentType(response.headers['content-type']);
        this.data = '';
        response.setEncoding('binary');
        response.on('data', emitter.handleServerResponse);
        return response.on('end', function() {
          return emitter.emit('error', {
            message: "Server closed connection!"
          });
        });
      });
    }

    /*
     *
     * Find out the boundary string that delimits images.
     * If a boundary string is not found, it fallbacks to a default boundary.
     *
     */
    boundaryStringFromContentType(type) {
      var boundary, match;
      // M-JPEG content type looks like multipart/x-mixed-replace;boundary=<boundary-name>
      match = type.match(/multipart\/x-mixed-replace;\s*boundary=(.+)/);
      if ((match != null ? match.length : void 0) > 1) {
        boundary = match[1];
      }
      if (boundary == null) {
        boundary = '--myboundary';
        this.emit('error', {
          message: "Couldn't find a boundary string. Falling back to --myboundary."
        });
      }
      this.emit('debug', {
        message: 'Boundary set to: ' + boundary
      });
      return boundary;
    }

    handleServerResponse(chunk) {
      var boundary_index, boundary_percentage, matches, newImageBeginning, remaining, typeMatches;
      boundMethodCheck(this, Paparazzi);
      boundary_index = chunk.indexOf(this.boundary);
      boundary_percentage = boundary_index * 1.0 / chunk.length;
      // If a boundary is found, generate a new image from the data accumulated up to the boundary.
      // Otherwise keep eating. We will probably find a boundary in the next chunk.
      if (boundary_index !== -1 && boundary_percentage < 0.98) {
        // Append remaining data
        this.data += chunk.substring(0, boundary_index);
        // Now we got a new image
        this.image = this.data;
        this.emit('update', this.image);
        // Start over
        this.data = '';
        // Grab the remaining bytes of chunk
        remaining = chunk.substring(boundary_index);
        // Try to find the type of the next image
        typeMatches = remaining.match(/Content-Type:\s+image\/jpeg\s+/);
        // Try to find the length of the next image
        matches = remaining.match(/Content-Length:\s+(\d+)\s+/);
        if ((matches != null) && matches.length > 1) {
          // Grab length of new image and save first chunk
          newImageBeginning = remaining.indexOf(matches[0]) + matches[0].length;
          this.imageExpectedLength = matches[1];
          this.data += remaining.substring(newImageBeginning);
        } else if (typeMatches != null) {
          // If Content-Length is not present, but Content-Type is
          newImageBeginning = remaining.indexOf(typeMatches[0]) + typeMatches[0].length;
          this.data += remaining.substring(newImageBeginning);
        } else {
          this.data += remaining;
          this.emit('debug', {
            message: 'Previous Image: ' + chunk.substring(0, boundary_index)
          });
          this.emit('debug', {
            message: 'New Image: ' + remaining
          }, remaining.length);
          this.emit('debug', {
            message: 'Current Boundary: ' + boundary_index
          });
          newImageBeginning = boundary_index + this.boundary.length;
          this.emit('error', {
            message: 'Boundary detected at end of frame. Copying to next frame.'
          });
        }
      } else {
        this.data += chunk;
      }
      // Threshold to avoid memory over-consumption
      // E.g. if a boundary string is never found, 'data' will never stop consuming memory
      if (this.data.length >= this.memory) {
        this.data = '';
        return this.emit('error', {
          message: 'Data buffer just reached threshold, flushing memory'
        });
      }
    }

  };

  Paparazzi.image = '';

  imageExpectedLength = -1;

  Paparazzi.options = options;

  Paparazzi.memory = options.memory || 8388608; // 8MB

  return Paparazzi;

}).call(this);

module.exports = Paparazzi;
