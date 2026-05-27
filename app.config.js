// Bakes apiBaseUrl from app.json into the app. Optional: EXPO_PUBLIC_API_BASE_URL at EAS build time only.
const os = require('os');

function getLanIpv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const v4 = net.family === 'IPv4' || net.family === 4;
      if (!v4 || net.internal) continue;
      const addr = net.address;
      if (/^(192\.168\.|10\.)/.test(addr)) return addr;
    }
  }
  return null;
}

module.exports = ({ config }) => {
  const fromAppJson = (config.extra && config.extra.apiBaseUrl) || '';
  const envUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
  const port = (process.env.EXPO_PUBLIC_API_PORT || '3000').trim();
  const isEasBuild = process.env.EAS_BUILD === 'true';

  let apiBaseUrl = fromAppJson.trim() || envUrl;

  // Local `expo start` only: auto-fill LAN IP when app.json has no URL.
  if (!apiBaseUrl && !isEasBuild) {
    const ip = getLanIpv4();
    if (ip) apiBaseUrl = `http://${ip}:${port}`;
  }

  if (!apiBaseUrl) apiBaseUrl = 'http://localhost:3000';

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      './plugins/withAndroidCleartext',
      './plugins/withMediaPipeModel',
    ],
    extra: {
      ...(config.extra || {}),
      apiBaseUrl,
    },
  };
};
