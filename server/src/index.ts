import { buildServer } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const app = await buildServer({ config });

try {
  await app.listen({ host: config.host, port: config.port });
  app.log.info(`Claudio server listening on http://${config.host}:${config.port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
