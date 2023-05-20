# release-typescript-action [![ts](https://github.com/int128/release-typescript-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/release-typescript-action/actions/workflows/ts.yaml)

This is an action to automate the release of an action written in TypeScript.

## Problem to solve

We need to commit the generated files (e.g. `dist/index.js`) because GitHub Actions runs it on Node.js.

It causes the following problems:

- Release workflow is complex
- Diff would be large because it contains the generated files
- Commit history would be growth

### How to solve

It would be nice to commit the generated files into a release tag only.

This action creates a release tag with the generated files.
For example,

```mermaid
graph TB
  subgraph branch [main Branch]
    Z[Initial Commit] --> A[Commit A] --> B[Commit B] --> C[Commit C] --> D[...]
  end
  A --> RA[Tag v1.0.0]
  B --> RB[Tag v1.1.0]
  C --> RC[Tag v1.2.0]
```

A release tag (e.g. Tag v1.0.0) contains the generated files, but `main` branch (e.g. Commit A, B and C) does not.

## Usecases

### Continuous release flow

This workflow continuously creates a new release from `main` branch.

```yaml
name: release

on:
  pull_request:
    paths:
      # To test this workflow
      - .github/workflows/release.yaml
  push:
    branches:
      # When the branch is pushed, release a new version of action
      - main

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
          cache: yarn
      - run: yarn
      - run: yarn build
      - run: yarn package
      - uses: int128/release-typescript-action@v1
```

When you merge a pull request into `main` branch, this action will create a new release of new minor version.
For example, if the latest tag `v1.5.0` exists, this action will create a tag `v1.6.0`.
It will also update the major tag `v1` to track the latest tag.

See also https://github.com/int128/typescript-action.

### Daily release flow

This workflow everyday creates a new release from `main` branch.

```yaml
name: release

on:
  pull_request:
    paths:
      # To test this workflow
      - .github/workflows/release.yaml
  schedule:
    # Release a new version every night if there is any change
    - cron: "0 0 * * *"

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      # (omit...)
      - run: yarn package
      - uses: int128/release-typescript-action@v1
```

When a schedule is triggered, this action will create a new minor release.
It will also update the major tag `v1` to track the latest tag.

### Manual release flow

You can manually create a new release in GitHub.
When you push a tag, this action will add a commit with `dist` directory to the tag.

```yaml
name: release

on:
  pull_request:
    paths:
      # To test this workflow
      - .github/workflows/release.yaml
  push:
    tags:
      # When a tag is pushed, this action adds the generated files
      - v*

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      # (omit...)
      - run: yarn package
      - uses: int128/release-typescript-action@v1
```

### Before stable release

To create v0 tag under development,

```yaml
jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      # (omit...)
      - run: yarn package
      - uses: int128/release-typescript-action@v1
        with:
          # TODO: change this on the stable release
          major-version: 0
```

## Specification

This action assumes the following repository layout:

- For polyrepo
  - `.gitignore` contains `/dist`
  - Generated files are under `dist`
  - Action definition is at `action.yaml`
- For monorepo
  - `.gitignore` contains `dist/`
  - Generated files are under `*/dist`
  - Action definitions are at `*/action.yaml`

It creates a new release only if the generated file(s) or action definition is changed.

It ignores any pull request event.

### Inputs

| Name | Default | Description
|------|----------|------------
| `major-version` | `1` | Major version to create a tag
| `increment-level` | `minor` | Either `minor` or `patch`
| `token` | `github.token` | GitHub token

If you want to create a new major release, set `major-version` to 2 or greater.
