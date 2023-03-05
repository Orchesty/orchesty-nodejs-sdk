// --- COMMONS ---
process.env.APP_ENV = 'prod' // 'debug' <= use it if you want to see more logs
process.env.CRYPT_SECRET = 'ThisIsNotSoSecret'
process.env.BACKEND_URL = 'http://127.0.0.40:8080'
process.env.STARTING_POINT_URL = 'https://sp.orchesty.com'
process.env.WORKER_API_HOST = 'https://wa.orchesty.com'

if(process.env.JEST_DOCKER){
  // --- DOCKER ---
  process.env.REDIS_DSN = 'redis://redis'
  process.env.MONGODB_DSN = 'mongodb://mongo'
} else {
  // --- LOCALHOST ---
  process.env.REDIS_DSN = 'redis://127.0.0.40'
  process.env.MONGODB_DSN = 'mongodb://127.0.0.40'
}



