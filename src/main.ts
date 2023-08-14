import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    majorVersion: parseInt(core.getInput('major-version', { required: true })),
    incrementLevel: core.getInput('increment-level', { required: true }),
    token: core.getInput('token', { required: true }),
  })
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
