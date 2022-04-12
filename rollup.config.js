import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'

const isProd = process.env.BUILD === 'production'


const Global = `var process = {
  env: {
    NODE_ENV: 'production'
  }
}`

export default {
  input: './src/main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    sourcemapExcludeSources: isProd,
    format: 'cjs',
    exports: 'default',
    banner: Global,
  },
  external: ['obsidian'],
  plugins: [
    typescript(),
    nodeResolve({ browser: true }),
    commonjs(),
    postcss({
      extract: true,
      extract: 'styles.css',
    }),
  ],
}
