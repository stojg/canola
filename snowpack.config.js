
module.exports = {
  optimize: {
    bundle: true,
    minify: true,
    target: 'es2017',
    treeshake: true
  },
  mount: {
    public: '/',
    src: '/dist',
  },
  plugins: ['@snowpack/plugin-typescript'],
  packageOptions: {
    types: true,
  },
  buildOptions: {
    out: 'docs',
    clean: true,
    sourcemap: true,
    baseUrl: 'https://stojg.github.io/canola/',
  }
}
