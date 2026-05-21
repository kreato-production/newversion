'use strict';
// Wrapper de compatibilidade iisnode → Next.js standalone.
// iisnode define PORT como um named pipe (ex: \\.\pipe\kreato\...).
// Next.js standalone usa parseInt(PORT) que retorna NaN para pipes.
// Este wrapper patcha net.Server.prototype.listen (implementação real do listen)
// antes de carregar o server.js para interceptar a chamada com porta numérica.

const net  = require('net');
const path = require('path');

process.env.NODE_ENV = 'production';
process.chdir(path.dirname(require.main.filename));

const rawPort     = process.env.PORT;
const isNamedPipe = rawPort && isNaN(parseInt(rawPort, 10));

if (isNamedPipe) {
  const originalListen = net.Server.prototype.listen;

  net.Server.prototype.listen = function (port, ...args) {
    if (typeof port === 'number' || port === undefined) {
      // Next.js standalone chama listen(numericPort, hostname, callback)
      // Substituímos pelo named pipe do iisnode
      const cb = args.find((a) => typeof a === 'function');
      return cb
        ? originalListen.call(this, rawPort, cb)
        : originalListen.call(this, rawPort);
    }
    return originalListen.apply(this, [port, ...args]);
  };
}

require('./server.js');
