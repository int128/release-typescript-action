# release-typescript-action [![ts](https://github.com/int128/release-typescript-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/release-typescript-action/actions/workflows/ts.yaml)

This is an action to automate the release of an action written in TypeScript.


## Idea

This action 

```mermaid
graph TB
  subgraph branch [main Branch]
    Z[Initial Commit] --> A[Commit 1] --> B[Commit 2] --> C[Commit 3] --> D[...]
  end
  A --> RA[Tag v1.0.0]
  B --> RB[Tag v1.1.0]
  C --> RC[Tag v1.2.0]
```


## Continuous release workflow

Create `.github/workflows/release.yaml` as follows:

```yaml
name: release

on:
  pull_request:
    paths:
      - .github/workflows/release.yaml
  push:
    branches:
      - main
    tags:
      - v*

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 16
          cache: yarn
      - run: yarn
      - run: yarn build
      - run: yarn package
      - uses: int128/release-typescript-action@v1
```

This workflow continuously creates a new release from `main` branch.

When you merge a pull request into `main` branch, this action will create a new release of new minor version.
For example, if the latest tag `v1.5.0` exists, this action will create a tag `v1.6.0`.
It will also update the major tag `v1` to track the latest tag.

When you manually push a tag, this action will add a commit with `dist` directory to the tag.

This action ignores any pull request event.


## Daily release workflow

Create `.github/workflows/release.yaml` as follows:

```yaml
name: release

on:
  pull_request:
    paths:
      - .github/workflows/release.yaml
  push:
    tags:
      - v*
  schedule:
    - cron: "0 0 * * *"

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 16
          cache: yarn
      - run: yarn
      - run: yarn build
      - run: yarn package
      - uses: int128/release-typescript-action@v1
```

This workflow everyday creates a new release from `main` branch.
It bumps the minor version.
It also updates the major tag `v1` to track the latest tag.

You can create a new release instead of the daily release.
When you push a tag, this action will add a commit with `dist` directory to the tag.

This action ignores any pull request event.


## Specification

This action assumes the following layout:

- For polyrepo
  - `.gitignore` contains `/dist`
  - Generated files are under `dist`
  - Action definition is at `action.yaml`
- For monorepo
  - `.gitignore` contains `dist/`
  - Generated files are under `*/dist`
  - Action definitions are at `*/action.yaml`

It creates a new release only if the generated file(s) or action definition is changed.


### Inputs

| Name | Default | Description
|------|----------|------------
| `major-version` | `1` | Major version to create a tag
| `token` | `github.token` | GitHub token

If you want to create a new major release, set `major-version` to 2 or greater.
