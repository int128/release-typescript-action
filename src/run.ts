import * as core from '@actions/core'
import * as github from '@actions/github'
import { createNextMinorRelease } from './create'
import { updateCurrentTag } from './update'

type Inputs = {
  majorVersion: number
  token: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  if (github.context.ref.startsWith('refs/tags/')) {
    core.info('Updating the current tag if generated files are different')
    return updateCurrentTag()
  }

  core.info('Creating the next release')
  return createNextMinorRelease(inputs)
}
