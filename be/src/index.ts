import { createCommandLineApplication } from '~/cli';
import { logger } from '~/logger';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  try {
    const app = createCommandLineApplication();
    await app.parseAsync(process.argv);
  } catch (error) {
    logger.error({ err: error }, '🚩 There was an unexpected error while running Platform CLI.');
  }
})();
