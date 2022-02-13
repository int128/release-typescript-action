import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    majorVersion: parseInt(core.getInput('major-version', { required: true })),
    token: core.getInput('token', { required: true }),
  })
}

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)))
