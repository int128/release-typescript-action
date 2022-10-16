import * as core from '@actions/core'
import { run } from './run'
import { getInputs } from './inputs'

const main = async (): Promise<void> => {
  const inputs = getInputs()
  await run(inputs)
}

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)))
