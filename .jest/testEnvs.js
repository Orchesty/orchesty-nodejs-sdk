// --- COMMONS ---
process.env.APP_ENV = 'debug'

process.env.CRYPT_SECRET = 'ThisIsNotSoSecret'

process.env.BACKEND_URL = 'http://127.0.0.40:8080'
process.env.STARTING_POINT_URL = 'https://sp.orchesty.com'

if(process.env.JEST_DOCKER){
  // --- DOCKER ---
  process.env.UDP_LOGGER_DSN = 'logstash:5005'

  process.env.METRICS_DSN = 'mongodb://mongo:27017/metrics'

  process.env.MONGODB_DSN = 'mongodb://mongo:27017/node-sdk'
} else {
  // --- LOCALHOST ---
  process.env.UDP_LOGGER_DSN = '127.0.0.40:5005'

  process.env.METRICS_DSN = 'mongodb://127.0.0.40:27017/metrics'

  process.env.MONGODB_DSN = 'mongodb://127.0.0.40:27017/node-sdk'
}



