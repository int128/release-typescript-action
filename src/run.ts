import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import { createNextRelease } from './create.js'
import type { Context } from './github.js'
import type { Level } from './semver.js'
import { followUpCurrentTag } from './update.js'

type Inputs = {
  majorVersion: number
  incrementLevel: Level
}

type Outputs = {
  releaseTag: string
}

export const run = async (inputs: Inputs, octokit: Octokit, context: Context): Promise<Outputs | undefined> => {
  if (context.ref.startsWith('refs/tags/')) {
    core.info('Following up the current tag if the generated files are changed')
    followUpCurrentTag(octokit, context)
    return
  }
  core.info('Preparing the next release')
  return createNextRelease(inputs, octokit, context)
}
