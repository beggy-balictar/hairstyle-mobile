// Dynamic Expo config: backend URL follows your PC's LAN IP so it keeps working when Wi‑Fi changes.
// For EAS/cloud builds, set EXPO_PUBLIC_API_BASE_URL to your deployed API (required on build servers).
const os = require('os');

function getLanIpv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const v4 = net.family === 'IPv4' || net.family === 4;
      if (!v4 || net.internal) continue;
      const addr = net.address;
      if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(addr)) {
        return addr;
      }
    }
  }
  return null;
}

module.exports = ({ config }) => {
  const envUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
  const port = (process.env.EXPO_PUBLIC_API_PORT || '3000').trim();
  const ip = getLanIpv4();
  const fallback = (config.extra && config.extra.apiBaseUrl) || '';
  const apiBaseUrl =
    envUrl || (ip ? `http://${ip}:${port}` : fallback || `http://localhost:${port}`);

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      apiBaseUrl,
    },
  };
};
