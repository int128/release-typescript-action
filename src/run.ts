import * as core from '@actions/core'
import * as github from '@actions/github'
import { createNextRelease } from './create.js'
import { followUpCurrentTag } from './update.js'

type Inputs = {
  majorVersion: number
  incrementLevel: string
  token: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  if (github.context.ref.startsWith('refs/tags/')) {
    core.info('Following up the current tag if the generated files are changed')
    return followUpCurrentTag()
  }

  core.info('Preparing the next release')
  const { incrementLevel } = inputs
  if (incrementLevel !== 'minor' && incrementLevel !== 'patch') {
    throw new Error(`increment-level must be either minor or patch`)
  }
  return createNextRelease({ ...inputs, level: incrementLevel })
}
