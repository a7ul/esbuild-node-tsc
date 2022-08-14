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

esbuild-node-tsc reads the tsconfig.json and builds the typescript project using esbuild. esbuild is the fastest typescript builder around.
The purpose of this library is to read tsconfig and translate the options to esbuild.

You can also perform custom postbuild and prebuild operations like copying non ts files such as json, graphql files, images,etc to the dist folder or cleaning up build folder.

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
npm install --save-dev nodemon esbuild-node-tsc esbuild
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

## v2.0 Migration and Breaking changes 🌱

In v2.0, esbuild-node-tsc no longer has cpy and rimraf preinstalled and doesnt perform any non source file copying automatically.
Instead it exposes prebuild and postbuild hooks which can be used to perform custom operations. See the example below for more details.

## Optional configuration

By default esbuild-node-tsc should work out of the box for your project since it reads the necessary configuration from your tsconfig.json

But if things are not working as expected you can configure esbuild-node-tsc by adding `etsc.config.js` along side tsconfig.json.

Example `etsc.config.js`

```js
module.exports = {
  // Supports all esbuild.build options
  esbuild: {
    minify: false,
    target: "es2015",
  },
  // Prebuild hook
  prebuild: async () => {
    console.log("prebuild");
    const rimraf = (await import("rimraf")).default;
    rimraf.sync("./dist"); // clean up dist folder
  },
  // Postbuild hook
  postbuild: async () => {
    console.log("postbuild");
    const cpy = (await import("cpy")).default;
    await cpy(
      [
        "src/**/*.graphql", // Copy all .graphql files
        "!src/**/*.{tsx,ts,js,jsx}", // Ignore already built files
      ],
      "dist"
    );
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
