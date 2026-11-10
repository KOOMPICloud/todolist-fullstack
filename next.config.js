const fs = require('fs');
const os = require('os');

// Next.js starts a build worker for every CPU of the machine, even in a
// container given two (KOOMPI Cloud's sandbox, a build): 15 workers on 2 CPUs
// made a build about 3 s slower. This counts the CPUs the build can use.
function buildCpus() {
  let cpus = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length;
  try {
    const [quota, period] = fs.readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim().split(/\s+/);
    if (quota !== 'max') cpus = Math.min(cpus, Math.ceil(Number(quota) / Number(period)));
  } catch {
    // Not a cgroup v2 container: every CPU it sees.
  }
  return Math.max(1, cpus);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // undici (lib/db.ts, lib/auth-server.ts) is loaded from node_modules, once, as
  // the server starts: bundled, each part of the server had its own copy, and
  // the first request to an API route waited about 30 ms for one.
  serverExternalPackages: ['undici'],
  experimental: { cpus: buildCpus() },
  // sharp is only for Next.js's image optimizer, which this app doesn't use
  // (images.unoptimized below): left out of the server's files, every deploy
  // pushes and pulls about 47 MB less (sharp's two copies of libvips; the
  // packages went from 28.5 to 11.8 MB compressed). Turning the optimizer on
  // needs it back: remove this line with unoptimized.
  outputFileTracingExcludes: { '*': ['node_modules/sharp/**', 'node_modules/@img/**'] },
  images: {
    // Serve images straight from object storage — the client fetches them
    // directly instead of routing through the Next.js image optimizer.
    unoptimized: true,
  },
};

module.exports = nextConfig;
