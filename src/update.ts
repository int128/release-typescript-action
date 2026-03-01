import * as core from '@actions/core'
import * as exec from '@actions/exec'
import type { Octokit } from '@octokit/action'
import { commitCurrentChanges, signCurrentCommit } from './commit.js'
import type { Context } from './github.js'

type Inputs = {
  dryRun: boolean
}

export const followUpCurrentTag = async (inputs: Inputs, octokit: Octokit, context: Context) => {
  const currentTag = context.ref.substring('refs/tags/'.length)
  core.info(`The current tag is ${currentTag}`)
  if (!currentTag.startsWith('v')) {
    throw Error(`Tag name should start with v but was ${currentTag}`)
  }

  await exec.exec('sed', ['-i', '-E', 's|^/?dist/?||g', '.gitignore'])
  await exec.exec('rm', ['-fr', '.github/workflows'])

  await exec.exec('git', ['add', '.'])
  if ((await gitStatus()) === '') {
    core.info(`The current tag ${currentTag} is up-to-date`)
    return
  }

  await commitCurrentChanges(`Release ${currentTag}`, context)
  await signCurrentCommit(octokit, context)

  await exec.exec('git', ['tag', '-f', currentTag])

  if (inputs.dryRun) {
    core.warning(`[dry-run] Updating the current tag ${currentTag}`)
    return
  }
  await exec.exec('git', ['push', 'origin', '-f', currentTag])
}

const gitStatus = async (): Promise<string> => {
  const { stdout } = await exec.getExecOutput('git', ['status', '--porcelain'])
  return stdout.trim()
}
