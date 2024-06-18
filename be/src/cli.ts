/* istanbul ignore */
import { Command } from 'commander';

import { run as runServer } from '~/server';

import { version } from '../package.json';

export function createCommandLineApplication() {
  const app = new Command();
  app.name('platform').description('CLI application for platform service').version(version);

  function makeServerCommand() {
    const startCommand = new Command('start');
    startCommand.description('Runs a local web server');
    startCommand.action(runServer);

    const serverCommand = new Command('server');
    serverCommand.description('Server related commands');
    serverCommand.addCommand(startCommand);

    return serverCommand;
  }

  app.addCommand(makeServerCommand());

  return app;
}
