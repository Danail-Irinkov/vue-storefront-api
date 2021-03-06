import Redis from 'redis'

/**
 * Return Redis Client
 * @param {config} config
 */
let redisClient = null

export function getClient (config) {
  if (!redisClient) {
    redisClient = Redis.createClient({...config.redis, retry_strategy: 2000}); // redis client
    // redisClient.on('error', (err) => { // workaround for https://github.com/NodeRedis/node_redis/issues/713
    //   redisClient = Redis.createClient(config.redis); // redis client
    // });
    if (config.redis.auth) {
      redisClient.auth(config.redis.auth);
    }

    redisClient.on('ready', () => {
      console.log('redis is running1');
      return ('redis is running2')
    });
    redisClient.on('error', (e) => {
      if (Math.random() > 0.99) { console.log('ERROR REDIS CONNECTION1 ', e, config.redis); }
      return (e)
    });
  }
  return redisClient
}
