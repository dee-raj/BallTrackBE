import app from './app';
import { config } from './config';
import { createServer } from 'http';

const PORT = config.port;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default server;
