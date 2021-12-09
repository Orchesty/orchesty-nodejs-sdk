// eslint-disable-next-line no-shadow
enum CoreServices {
  CRYPT_MANAGER = 'hbpf.core.crypt_manager',
  MONGO = 'hbpf.core.mongo',
  LOADER = 'hbpf.core.common_loader',
  APP_LOADER = 'hbpf.core.app_loader',
  APP_MANAGER = 'hbpf.core.app_manager',
  WEBHOOK_MANAGER = 'hbpf.core.webhook_manager',
  OAUTH2_PROVIDER = 'hbpf.core.oauth2_provider',
  CURL = 'hbpf.core.curl_sender',
  METRICS = 'hbpf.core.metrics',
  TOPOLOGY_RUNNER = 'hbpf.core.topology_runner',
}

export default CoreServices;
