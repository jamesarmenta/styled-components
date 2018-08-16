/* eslint-disable flowtype/require-valid-file-annotation, no-console, import/extensions */
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'
import flow from 'rollup-plugin-flow'
import { terser } from 'rollup-plugin-terser'
import sourceMaps from 'rollup-plugin-sourcemaps'

// rollup-plugin-ignore stopped working, so we'll just remove the import lines 😐
const propTypeIgnore = { "import PropTypes from 'prop-types';": "'';" }
const streamIgnore = { "import stream from 'stream';": "'';" }

const cjs = {
  exports: 'named',
  format: 'cjs',
  sourcemap: true,
}

const esm = {
  format: 'esm',
  sourcemap: true,
}

const getCJS = override => ({ ...cjs, ...override })
const getESM = override => ({ ...esm, ...override })

const commonPlugins = [
  flow({
    // needed for sourcemaps to be properly generated
    pretty: true,
  }),
  sourceMaps(),
  json(),
  nodeResolve(),
  babel({
    exclude: 'node_modules/**',
    plugins: ['external-helpers'],
  }),
  commonjs({
    ignoreGlobal: true,
    namedExports: {
      'react-is': ['isValidElementType'],
    },
  }),
  replace({
    __DEV__: JSON.stringify(false), // disable flag indicating a Jest run
  }),
]

const prodPlugins = [
  replace({
    ...propTypeIgnore,
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  terser({
    sourceMap: true,
  }),
]

const configBase = {
  input: './src/index.js',

  // \0 is rollup convention for generated in memory modules
  external: id =>
    !id.startsWith('\0') && !id.startsWith('.') && !id.startsWith('/'),
  plugins: commonPlugins,
}

const globals = { react: 'React' }

const umdBaseConfig = {
  ...configBase,
  output: {
    exports: 'named',
    file: 'dist/styled-components.js',
    format: 'umd',
    globals,
    name: 'styled',
    sourcemap: true,
  },
  external: Object.keys(globals),
  plugins: configBase.plugins.concat(
    replace({
      ...streamIgnore,
      __SERVER__: JSON.stringify(false),
    })
  ),
}

const umdConfig = {
  ...umdBaseConfig,
  plugins: umdBaseConfig.plugins.concat(
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
    })
  ),
}

const umdProdConfig = {
  ...umdBaseConfig,
  output: Object.assign({}, umdBaseConfig.output, {
    file: 'dist/styled-components.min.js',
  }),
  plugins: umdBaseConfig.plugins.concat(prodPlugins),
}

const serverConfig = {
  ...configBase,
  output: [
    getESM({ file: 'dist/styled-components.esm.js' }),
    getCJS({ file: 'dist/styled-components.cjs.js' }),
  ],
  plugins: configBase.plugins.concat(
    replace({
      __SERVER__: JSON.stringify(true),
    })
  ),
}

const serverProdConfig = {
  ...configBase,
  ...serverConfig,
  output: [
    getESM({ file: 'dist/styled-components.esm.min.js' }),
    getCJS({ file: 'dist/styled-components.cjs.min.js' }),
  ],
  plugins: serverConfig.plugins.concat(prodPlugins),
}

const browserConfig = {
  ...configBase,
  output: [
    getESM({ file: 'dist/styled-components.browser.esm.js' }),
    getCJS({ file: 'dist/styled-components.browser.cjs.js' }),
  ],
  plugins: configBase.plugins.concat(
    replace({
      ...streamIgnore,
      __SERVER__: JSON.stringify(false),
    })
  ),
}

const browserProdConfig = {
  ...configBase,
  ...browserConfig,
  output: [
    getESM({
      file: 'dist/styled-components.browser.esm.min.js',
    }),
    getCJS({
      file: 'dist/styled-components.browser.cjs.min.js',
    }),
  ],
  plugins: browserConfig.plugins.concat(prodPlugins),
}

const nativeConfig = {
  ...configBase,
  input: './src/native/index.js',
  output: getCJS({
    file: 'dist/styled-components.native.cjs.js',
  }),
}

const primitivesConfig = {
  ...configBase,
  input: './src/primitives/index.js',
  output: [
    getESM({ file: 'dist/styled-components-primitives.esm.js' }),
    getCJS({
      file: 'dist/styled-components-primitives.cjs.js',
    }),
  ],
  plugins: configBase.plugins.concat(
    replace({
      __SERVER__: JSON.stringify(true),
    })
  ),
}

export default [
  umdConfig,
  umdProdConfig,
  serverConfig,
  serverProdConfig,
  browserConfig,
  browserProdConfig,
  nativeConfig,
  primitivesConfig,
]
