import path from 'path'
import ts from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.ts',
  output: [
    {
      name: 'HeatMap',
      file: 'dist/index.cjs.js',
      format: 'cjs',
      exports: 'default'
    },
    {
      name: 'HeatMap',
      file: 'dist/index.esm.js',
      format: 'es',
      exports: 'default'
    },
    {
      name: 'HeatMap',
      file: 'dist/index.js',
      format: 'iife',
      exports: 'default'
    }
  ],
  plugins: [
    json({
      namedExports: false
    }),
    nodeResolve(),
    ts({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    }),
    commonjs(),
    production && terser()
  ]
};
