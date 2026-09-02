function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Testing Vite Config & Server Middleware Plugin Integration...');
  const { roadmapApiPlugin } = await import('file:///f:/NOVARA/server/apiMiddleware.js');

  const plugin = roadmapApiPlugin();
  assert(plugin.name === 'novara-roadmap-api-plugin', 'Vite API middleware plugin initialized with correct name');
  assert(typeof plugin.configureServer === 'function', 'Plugin exposes configureServer middleware hook');

  // Test mock middleware registration
  let middlewareRegistered = false;
  const mockServer = {
    middlewares: {
      use: (fn) => {
        if (typeof fn === 'function') middlewareRegistered = true;
      }
    }
  };

  plugin.configureServer(mockServer);
  assert(middlewareRegistered === true, 'API middleware attached to Vite dev server pipeline');

  console.log('🎉 Vite Integration Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
