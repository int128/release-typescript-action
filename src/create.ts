import * as core from '@actions/core'
import * as exec from '@actions/exec'
import type { Octokit } from '@octokit/action'
import { commitCurrentChanges, signCurrentCommit } from './commit.js'
import type { Context } from './github.js'
import { computeNextTag, type Level } from './semver.js'

type Inputs = {
  majorVersion: number
  incrementLevel: Level
  dryRun: boolean
}

export const createNextRelease = async (inputs: Inputs, octokit: Octokit, context: Context) => {
  const majorTag = `v${inputs.majorVersion}`
  core.info(`The major tag is ${majorTag}`)

  await exec.exec('git', ['fetch', '--tags', '--prune-tags', '--prune'])
  const currentTag = await findCurrentTag(majorTag)
  core.info(`The current tag is ${currentTag ?? 'not found'}`)

  const nextTag = computeNextTag(currentTag, majorTag, inputs.incrementLevel)
  core.info(`The next tag is ${nextTag}`)

  await exec.exec('sed', ['-i', '-E', 's|^/?dist/?||g', '.gitignore'])
  await exec.exec('rm', ['-fr', '.github/workflows'])

  await commitCurrentChanges(`Release ${nextTag}`, context)
  await signCurrentCommit(octokit, context)

  await exec.exec('git', ['tag', nextTag])

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
    core.info('The generated file(s) is changed')
  }

  if (inputs.dryRun) {
    core.warning(`[dry-run] Creating the next tag ${nextTag}`)
    return
  }
  await exec.exec('git', ['push', 'origin', nextTag])

  // Update the major tag if the next tag has been successfully created.
  await exec.exec('git', ['tag', '-f', majorTag])
  await exec.exec('git', ['push', 'origin', '-f', majorTag])

  core.info(`Creating a release for the tag ${nextTag}`)
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
}

export const findCurrentTag = async (majorTag: string): Promise<string | undefined> => {
  const revParseCode = await exec.exec('git', ['rev-parse', '--verify', `refs/tags/${majorTag}`], {
    ignoreReturnCode: true,
  })
  if (revParseCode !== 0) {
    core.info(`The major tag ${majorTag} does not exist`)
    return
  }

  const { stdout } = await exec.getExecOutput('git', ['tag', '--list', '--contains', majorTag])
  const currentTags = stdout.split(/\n/).filter((tag) => tag !== '' && tag !== majorTag)
  if (currentTags.length === 0) {
    throw new Error(`The major tag ${majorTag} does not point to any version tag`)
  }
  if (currentTags.length > 1) {
    throw new Error(`The major tag ${majorTag} points to multiple version tags: ${currentTags.join(', ')}`)
  }
  return currentTags[0]
}

const getChangedFiles = async (currentTag: string, nextTag: string, patterns: string[]) => {
  const { stdout } = await exec.getExecOutput('git', ['diff', '--name-only', currentTag, nextTag, '--', ...patterns])
  return stdout.split(/\n/).filter((filename) => filename !== '')
}
