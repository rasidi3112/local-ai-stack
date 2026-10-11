import { FastifyInstance } from 'fastify';

export async function statusRoute(app: FastifyInstance): Promise<void> {
  app.get('/status', async (_request, reply) => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    return reply.send({
      service: 'pondok-ai-api',
      version: '0.1.0',
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      config: {
        ollamaUrl: app.config.ollamaBaseUrl,
        qdrantUrl: app.config.qdrantUrl || null,
      },
      timestamp: new Date().toISOString(),
    });
  });
}
