import { defineConfig } from '@rspack/cli';
import { rspack, type SwcLoaderOptions } from '@rspack/core';
import fs from 'fs';
import path from 'path';
import pkg from './package.json' with { type: 'json' };

type RspackConfigParams = {
  minify?: boolean;
};

const targets = ['last 2 versions', '> 0.2%', 'not dead', 'Firefox ESR'];

export default ({ minify = false }: RspackConfigParams) => {
  const version = minify ? `${pkg.version}-mini` : pkg.version;
  const filename = minify ? 'giveaways.mini.user.js' : 'giveaways.user.js';

  const meta = fs
    .readFileSync(path.resolve(__dirname, 'tampermonkey.meta.js'), 'utf8')
    .replace('__VERSION__', version)
    .replaceAll('__FILE_NAME__', filename);

  return defineConfig({
    entry: {
      main: './src/index.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: filename,
      clean: !minify,
    },
    resolve: {
      extensions: ['...', '.ts'],
    },
    module: {
      rules: [
        {
          test: /\.svg$/,
          type: 'asset',
        },
        {
          test: /\.css$/,
          type: 'asset/source',
        },
        {
          test: /\.html$/,
          type: 'asset/source',
        },
        {
          test: /\.js$/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'ecmascript',
                  },
                },
                env: { targets },
              } satisfies SwcLoaderOptions,
            },
          ],
        },
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                  },
                },
                env: { targets },
              } satisfies SwcLoaderOptions,
            },
          ],
        },
      ],
    },
    plugins: [
      {
        name: 'inject-meta',
        apply(compiler) {
          compiler.hooks.done.tap('inject-meta', () => {
            const outFile = path.resolve(__dirname, 'dist', filename);
            let content = fs.readFileSync(outFile, 'utf8');
            content = meta + '\n' + content;
            fs.writeFileSync(outFile, content, 'utf8');
            console.log(`✅ Injected Tampermonkey metadata to ${filename}`);
          });
        },
      },
    ],
    optimization: {
      minimizer: minify ? [new rspack.SwcJsMinimizerRspackPlugin()] : [],
    },
    experiments: {
      css: false,
    },
  });
};
