module.exports = {
  mount: {
    public: '/',
    src: '/_dist_',
  },
  plugins: ['@snowpack/plugin-typescript'],
  install: [
    /* ... */
  ],
  installOptions: {
    installTypes: true,
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    out: "docs",
    clean: true,
    sourceMaps: true,
  },
  proxy: {
    /* ... */
  },
  alias: {
    /* ... */
  },
};
