# Publish to Public npm

This guide helps you publish `interceptor-brain` for community use.

## 1) Choose your package name

Current name is `@interceptor/brain-mcp`.

- If you own npm scope `@interceptor`, keep it.
- If not, change `name` in `package.json` to your scope, for example:
  - `@your-npm-username/brain-mcp`
  - `@your-org/interceptor-brain-mcp`

## 2) Build and verify locally

```bash
npm install
npm run check
npm run build
npm pack
```

Optional local smoke test:

```bash
npm link
interceptor-brain-init
```

## 3) Login and publish

```bash
npm login
npm publish --access public
```

## 4) Verify install from registry

```bash
npm i -g <your-package-name>
interceptor-brain-init
```

## 5) Community quickstart

Include this in your README release notes:

```bash
npm i -g <your-package-name>
interceptor-brain-init
```
