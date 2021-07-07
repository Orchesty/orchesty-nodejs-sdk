// --- COMMONS ---
process.env.APP_ENV = 'debug'

process.env.CRYPT_SECRET = 'ThisIsNotSoSecret'

process.env.BACKEND_URL = 'http://127.0.0.40:8080'

if(process.env.JEST_DOCKER){
  // --- DOCKER ---
  process.env.UDP_LOGGER_HOST = 'logstash'
  process.env.UDP_LOGGER_PORT = '5005'

  process.env.METRICS_DSN = 'mongodb://mongo:27017/metrics'

  process.env.MONGO_DSN = 'mongodb://mongo:27017/node-sdk'
} else {
  // --- LOCALHOST ---
  process.env.UDP_LOGGER_HOST = '127.0.0.40'
  process.env.UDP_LOGGER_PORT = '5005'

  process.env.METRICS_DSN = 'mongodb://127.0.0.40:27017/metrics'

  process.env.MONGO_DSN = 'mongodb://127.0.0.40:27017/node-sdk'
}



