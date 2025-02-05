import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      // Specify the entry point of your library.
      entry: resolve(__dirname, 'src/index.js'),
      // This is the global variable name that your UMD bundle will export to.
      name: 'UmdExample',
      // Output filename; the placeholder [format] will be replaced with “umd”.
      fileName: (format) => `umd-example-app.${format}.js`,
      // We only want a UMD build.
      formats: ['umd']
    },
    rollupOptions: {
      // If you want to include all dependencies in the bundle, leave external empty.
      // If you’d rather load some dependencies via CDN or separate <script> tags,
      // mark them as external and provide their global names. For example:
      //
    //   external: ['@reown/appkit', '@reown/appkit-adapter-wagmi', '@wagmi/core', 'viem', 'wagmi'],
    //   output: {
    //     globals: {
    //       '@reown/appkit': 'AppKit',
    //       '@reown/appkit-adapter-wagmi': 'AppKitWagmi',
    //       '@wagmi/core': 'wagmiCore',
    //       viem: 'viem',
    //       wagmi: 'wagmi'
    //     }
    //   }
    }
  }
})
