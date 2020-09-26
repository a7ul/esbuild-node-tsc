# ⚡️ esbuild-node-tsc

Build your Typescript Node.js projects using blazing fast **[esbuild](https://github.com/evanw/esbuild)**.

Since esbuild can build large typescript node projects in subsecond speeds, this is quite useful for development builds too if you want to stick with `tsc` for production builds.

<img src="https://github.com/a7ul/esbuild-node-tsc/releases/download/v1.0.1/demo-img.gif" alt="demo" />

**_Please not this library doesnt do typechecking. For typechecking please continue to use tsc._**

## How does it work?

esbuild-node-tsc reads the tsconfig.json and builds the typescript project using esbuild. esbuild is the fastest typescript builder around. It also copies the non ts files such as json, graphql files, images,etc to the dist folder. If the assets are not copied correctly check the configuration guide below.

## Installation

```
npm install --save-dev esbuild-node-tsc
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
  "exec": "etsc",
  "legacyWatch": true
}
```

Finally run

```
npm run dev
```

## Optional configuration

By default esbuild-node-tsc should work out of the box for your project since it reads the necessary configuration from your tsconfig.json

But if things are not working as expected you can configure esbuild-node-tsc by adding `etsc.config.js` along side tsconfig.json.

Example `etsc.config.js`

```js
module.exports = {
  outDir: "./dist",
  esbuild: {
    minify: false,
    target: "es2015",
  },
  assets: {
    baseDir: "src",
    filePatterns: ["**/*.json"],
  },
};
```

All of the above fields are optional

## License

MIT
