const cluster = require('cluster')
import * as os from 'os';

export function runInCluster(
  bootstrap: () => Promise<void>
) {
  const numberOfCores = process.env.NODE_ENV === 'production' ? os.cpus().length : 4;

  if (cluster.isMaster) {
    for (let i = 0; i < numberOfCores; ++i) {
      cluster.fork();
    }

    cluster.on('online', function(worker) {
      console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
      console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
      console.log('Starting a new worker');
      cluster.fork();
    });
  } else {
    bootstrap();
  }
}
