# release-typescript-action [![ts](https://github.com/int128/release-typescript-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/release-typescript-action/actions/workflows/ts.yaml)

This is an action to automate the release of a TypeScript Action.


## Getting Started

Create the following workflow:

```yaml
name: release

on:
  pull_request:
    branches: [main]
    paths:
      - .github/workflows/release.yaml
  push:
    branches: [main]

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: yarn build
      - run: yarn package
      - uses: int128/release-typescript-action@v1
```

This action creates a new release of new minor version.
For example, if `v1.5.0` exists, this action creates `v1.6.0`.

It also creates or updates the major tag `v1` to track the latest release.


## Inputs

| Name | Default | Description
|------|----------|------------
| `major-version` | `1` | Major version to create a tag
| `token` | `github.token` | GitHub token
