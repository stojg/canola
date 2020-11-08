module.exports = {
  mount: {
    public: '/',
    src: '/dist',
  },
  plugins: ['@snowpack/plugin-typescript'],
  install: [
    /* ... */
  ],
  installOptions: {
    installTypes: true,
    dest: "web",
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    out: "docs",
    clean: true,
    sourceMaps: true,
    baseUrl: "https://stojg.github.io/canola/",
    webModulesUrl: "web",
  },
  proxy: {
    /* ... */
  },
  alias: {
    /* ... */
  },
};
