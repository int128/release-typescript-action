import * as core from '@actions/core'
import * as exec from '@actions/exec'
import type { Octokit } from '@octokit/action'
import { commitCurrentChanges, signCurrentCommit } from './commit.js'
import type { Context } from './github.js'
import { computeNextTag, type Level } from './semver.js'

type Inputs = {
  majorVersion: number
  incrementLevel: Level
}

export const createNextRelease = async (inputs: Inputs, octokit: Octokit, context: Context) => {
  const majorTag = `v${inputs.majorVersion}`
  core.info(`Major tag is ${majorTag}`)

  await exec.exec('git', ['fetch', '--tags', '--prune-tags', '--prune'])
  const currentTag = await findCurrentTag(majorTag)
  core.info(`Current tag is ${currentTag ?? 'not found'}`)

  const nextTag = computeNextTag(currentTag, majorTag, inputs.incrementLevel)
  core.info(`Next tag is ${nextTag}`)

  await exec.exec('sed', ['-i', '-E', 's|^/?dist/?||g', '.gitignore'])
  await exec.exec('rm', ['-fr', '.github/workflows'])

  await commitCurrentChanges(`Release ${nextTag}`, context)
  await signCurrentCommit(octokit, context)

  await exec.exec('git', ['tag', nextTag])
  await exec.exec('git', ['tag', '-f', majorTag])

  if (currentTag !== undefined) {
    const changedFiles = await getChangedFiles(currentTag, nextTag, [
      'action.yaml',
      'action.yml',
      'dist/**',
      '*/action.yaml',
      '*/action.yml',
      '*/dist/**',
    ])
    if (changedFiles.length === 0) {
      core.info('Nothing to release')
      return
    }
    core.info('Generated file(s) is changed')
  }

  if (context.eventName === 'pull_request') {
    core.warning(`Next release is ${nextTag} but do nothing on pull request`)
    return
  }
  await exec.exec('git', ['push', 'origin', '-f', nextTag, majorTag])

  core.info(`Creating a release for tag ${nextTag}`)
  const { data: releaseNote } = await octokit.rest.repos.generateReleaseNotes({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: nextTag,
    previous_tag_name: currentTag,
  })
  const { data: release } = await octokit.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    name: releaseNote.name,
    body: releaseNote.body,
    tag_name: nextTag,
  })
  core.info(`Created a release as ${release.html_url}`)
  return {
    releaseTag: release.tag_name,
  }
}

export const findCurrentTag = async (majorTag: string): Promise<string | undefined> => {
  const { stdout } = await exec.getExecOutput('git', ['tag', '--list', '--contains', majorTag], {
    ignoreReturnCode: true,
  })
  return stdout
    .split(/\n/)
    .filter((tag) => tag !== '' && tag !== majorTag)
    .pop()
}

const getChangedFiles = async (currentTag: string, nextTag: string, patterns: string[]) => {
  const { stdout } = await exec.getExecOutput('git', ['diff', '--name-only', currentTag, nextTag, '--', ...patterns])
  return stdout.split(/\n/).filter((filename) => filename !== '')
}
