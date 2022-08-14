# ⚡️ esbuild-node-tsc

Build your Typescript Node.js projects using blazing fast **[esbuild](https://github.com/evanw/esbuild)**.

Since esbuild can build large typescript node projects in subsecond speeds, this is quite useful for development builds too if you want to stick with `tsc` for production builds.

**_Please note this library doesnt do typechecking. For typechecking please continue to use tsc._**

## Alternatives

Recently, Many alternatives have been released that allow using esbuild with nodejs projects.

You could try these too. They solve the same problem but using require hooks instead.

- **[esbuild-node-loader](https://github.com/antfu/esbuild-node-loader) by [@antfu](https://github.com/antfu)**
- **[esbuild-register](https://github.com/egoist/esbuild-register) by [@egoist](https://github.com/egoist)**
- **[ts-eager](https://github.com/mhart/ts-eager) by [@mhart](https://github.com/mhart)**

## How does it work?

esbuild-node-tsc reads the tsconfig.json and builds the typescript project using esbuild. esbuild is the fastest typescript builder around. It also copies the non ts files such as json, graphql files, images,etc to the dist folder. If the assets are not copied correctly check the configuration guide below.

## Installation

```
npm install --save-dev esbuild esbuild-node-tsc
```

## Usage

```
npx esbuild-node-tsc
```

or use the short form.

```
npx etsc
```

Additionally, you can add it to your build scripts

```json
{
  "name": "myproject",
  "version": "0.1.0",
  "scripts": {
    "dev": "etsc"
  }
}
```

Then just run

```
npm run dev
```

## Live reloading (nodemon ❤️ esbuild-node-tsc)

Since esbuild can build large typescript projects in subsecond speeds you can use this library instead of ts-node-dev or ts-node which usually slow down when project scales.

To achieve live reloading:

```
npm install --save-dev nodemon esbuild-node-tsc
```

Then add the following script to package.json

```json
{
  "name": "myproject",
  "version": "0.1.0",
  "scripts": {
    "dev": "nodemon"
  }
}
```

And add a `nodemon.json`

```json
{
  "watch": ["src"],
  "ignore": ["src/**/*.test.ts"],
  "ext": "ts,mjs,js,json,graphql",
  "exec": "etsc && node ./dist/index.js",
  "legacyWatch": true
}
```

Finally run

```
npm run dev
```

## Comparison with tsc

<img src="https://user-images.githubusercontent.com/4029423/94347242-c6497600-0032-11eb-8a66-4311adf04554.gif" width="638" height="750">

## Optional configuration

By default esbuild-node-tsc should work out of the box for your project since it reads the necessary configuration from your tsconfig.json

But if things are not working as expected you can configure esbuild-node-tsc by adding `etsc.config.js` along side tsconfig.json.

> You might need to install `esbuild-plugin-tsc` package too to use the esbuild tsc plugin

Example `etsc.config.js`

```js
const esbuildPluginTsc = require("esbuild-plugin-tsc");

module.exports = {
  outDir: "./dist",
  esbuild: {
    minify: false,
    target: "es2015",
    plugins: [esbuildPluginTsc()],
  },
  assets: {
    baseDir: "src",
    outDir: "./dist",
    filePatterns: ["**/*.json"],
  },
};
```

or if you use ESM in your project then use

```js
import esbuildPluginTsc from "esbuild-plugin-tsc";

export default {
  outDir: "./dist",
  esbuild: {
    minify: false,
    target: "es2015",
    plugins: [esbuildPluginTsc()],
  },
  assets: {
    baseDir: "src",
    outDir: "./dist",
    filePatterns: ["**/*.json"],
  },
};
```

All of the above fields are optional.

If you want to use different config files for different types of builds you can do so using the param `--config`. Example:

```
  "scripts": {
    "build": "etsc --config=etsc.config.build.js"
  }
```

## License

MIT
