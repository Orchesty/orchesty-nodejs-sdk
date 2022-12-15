// --- COMMONS ---
process.env.APP_ENV = 'debug'
process.env.CRYPT_SECRET = 'ThisIsNotSoSecret'
process.env.BACKEND_URL = 'http://127.0.0.40:8080'
process.env.STARTING_POINT_URL = 'https://sp.orchesty.com'
process.env.WORKER_API_HOST = 'https://wa.orchesty.com'

if(process.env.JEST_DOCKER){
  // --- DOCKER ---
  process.env.REDIS_DSN = 'redis://redis'
} else {
  // --- LOCALHOST ---
  process.env.REDIS_DSN = 'redis://127.0.0.40'
}



