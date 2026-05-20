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
  core.startGroup(`Fetching the tags from the remote repository`)
  await exec.exec('git', ['fetch', '--tags', '--prune-tags', '--prune'])
  core.endGroup()

  const majorTag = `v${inputs.majorVersion}`
  core.info(`The major tag is ${majorTag}`)
  const currentTag = await findCurrentTag(majorTag)
  core.info(`The current tag is ${currentTag ?? 'not found'}`)

  const nextTag = computeNextTag(currentTag, majorTag, inputs.incrementLevel)
  core.info(`The next tag is ${nextTag}`)

  await exec.exec('sed', ['-i', '-E', 's|^/?dist/?||g', '.gitignore'])
  await exec.exec('rm', ['-fr', '.github/workflows'])

  await commitCurrentChanges(`Release ${nextTag}`, context)
  const releaseCommitSHA = await signCurrentCommit(octokit, context)
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

  // Update the major tag if the next tag has been successfully created.
  const pushFlags = inputs.dryRun ? ['--dry-run'] : []
  await exec.exec('git', ['push', ...pushFlags, 'origin', nextTag])
  await exec.exec('git', ['tag', '-f', majorTag])
  await exec.exec('git', ['push', '-f', ...pushFlags, 'origin', majorTag])

  const releaseBody = await generateReleaseBody(releaseCommitSHA, currentTag, nextTag, octokit, context)
  core.startGroup(`Release note for ${nextTag}`)
  core.info(releaseBody)
  core.endGroup()

  if (inputs.dryRun) {
    core.warning(`[dry-run] Creating the next release ${nextTag}`)
    return
  }
  core.info(`Creating the next release ${nextTag}`)
  const { data: release } = await octokit.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    name: nextTag,
    body: releaseBody,
    tag_name: nextTag,
  })
  core.info(`Created a release as ${release.html_url}`)
}

const generateReleaseBody = async (
  releaseCommitSHA: string,
  currentTag: string | undefined,
  nextTag: string,
  octokit: Octokit,
  context: Context,
) => {
  const { data: generatedReleaseNote } = await octokit.rest.repos.generateReleaseNotes({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: nextTag,
    previous_tag_name: currentTag,
  })
  const body = `\
\`\`\`yaml
uses: ${context.repo.owner}/${context.repo.repo}@${releaseCommitSHA} # ${nextTag}
\`\`\`

${generatedReleaseNote.body}`

  // https://github.com/orgs/community/discussions/63414
  const maxReleaseBodyLength = 100000
  if (body.length > maxReleaseBodyLength) {
    core.warning(`The generated release note is too long. Truncating to ${maxReleaseBodyLength} characters.`)
    return `${body.slice(0, maxReleaseBodyLength)}...(truncated)`
  }
  return body
}

export const findCurrentTag = async (majorTag: string): Promise<string | undefined> => {
  const revParseCode = await exec.exec('git', ['rev-parse', '--verify', `refs/tags/${majorTag}`], {
    ignoreReturnCode: true,
  })
  if (revParseCode !== 0) {
    core.info(`The major tag ${majorTag} does not exist`)
    return
  }

  const { stdout } = await exec.getExecOutput('git', ['tag', '--list', '--contains', `refs/tags/${majorTag}`])
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
