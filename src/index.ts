import assert from 'node:assert'
import * as core from '@actions/core'
import { getContext, getOctokit } from './github.js'
import { run } from './run.js'
import type { Level } from './semver.js'

const main = async (): Promise<void> => {
  await run(
    {
      majorVersion: Number.parseInt(core.getInput('major-version', { required: true }), 10),
      incrementLevel: parseLevel(core.getInput('increment-level', { required: true })),
      dryRun: core.getBooleanInput('dry-run', { required: true }),
    },
    getOctokit(),
    await getContext(),
  )
}

const parseLevel = (s: string): Level => {
  assert(s === 'minor' || s === 'patch', `increment-level must be either 'minor' or 'patch' but was ${s}`)
  return s
}

try {
  await main()
} catch (e) {
  core.setFailed(e instanceof Error ? e : String(e))
  console.error(e)
}
