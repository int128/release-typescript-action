import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import { createNextRelease } from './create.js'
import type { Context } from './github.js'
import { followUpCurrentTag } from './update.js'

type Inputs = {
  majorVersion: number
  incrementLevel: string
}

export const run = async (inputs: Inputs, octokit: Octokit, context: Context): Promise<void> => {
  if (context.ref.startsWith('refs/tags/')) {
    core.info('Following up the current tag if the generated files are changed')
    return followUpCurrentTag(octokit, context)
  }

  core.info('Preparing the next release')
  const { incrementLevel } = inputs
  if (incrementLevel !== 'minor' && incrementLevel !== 'patch') {
    throw new Error(`increment-level must be either minor or patch`)
  }
  return createNextRelease({ ...inputs, level: incrementLevel }, octokit, context)
}
