import * as core from '@actions/core'
import * as github from '@actions/github'
import { createNextRelease } from './create'
import { followUpCurrentTag } from './update'

type Inputs = {
  majorVersion: number
  bumpComponent: string
  token: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  if (github.context.ref.startsWith('refs/tags/')) {
    core.info('Following up the current tag if the generated files are changed')
    return followUpCurrentTag()
  }

  core.info('Preparing the next release')
  const { bumpComponent } = inputs
  if (bumpComponent !== 'minor' && bumpComponent !== 'patch') {
    throw new Error(`bump-component must be minor or patch`)
  }
  return createNextRelease({ ...inputs, bumpComponent })
}
