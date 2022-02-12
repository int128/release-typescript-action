import * as core from '@actions/core'
import * as github from '@actions/github'
import { createNextMinorRelease } from './create'
import { updateCurrentTag } from './update'

type Inputs = {
  majorVersion: number
  token: string
  dryRun: boolean
}

export const run = async (inputs: Inputs): Promise<void> => {
  if (github.context.ref.startsWith('tags/')) {
    core.info('Updating the current tag if generated files are different')
    return updateCurrentTag(inputs)
  }
  core.info('Creating the next release')
  return createNextMinorRelease(inputs)
}
