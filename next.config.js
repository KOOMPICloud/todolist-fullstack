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
  experimental: { cpus: buildCpus() },
  images: {
    // Serve images straight from object storage — the client fetches them
    // directly instead of routing through the Next.js image optimizer.
    unoptimized: true,
  },
};

module.exports = nextConfig;
