import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { computeNextTags, toTag, VERSION_PREFIX } from './semver'
import { Inputs } from './inputs'

const DEFAULT_MAJOR_VERSION = 1

export const createNextRelease = async ({ majorVersion, incrementLevel, token }: Inputs) => {
  // Get the current tag, if any. The current tag might be
  // a major version (v1), a minor version (v1.2), or a patch version (v1.2.3).
  // Ideally, the current tag should be a patch version,
  // but it's possible that the user has manually created a tag like v1 or v1.0.
  const currentTag = await findCurrentTag(majorVersion)
  core.info(`Current tag: ${currentTag ?? 'not found'}`)
  core.info(`Increment level: ${incrementLevel}`)
  // Get the next tags (major, minor, and patch) based on the current tag and increment level.
  // If the current tag is v1.2.3 and the increment level is patch:
  // { major: v1, minor: v1.2, patch: v1.2.4 }
  const nextTags = computeNextTags(currentTag, incrementLevel, majorVersion ?? DEFAULT_MAJOR_VERSION)
  const nextTagsArray = Object.values(nextTags) as string[] // [v1, v1.2, v1.2.4]
  const representativeNextTag = nextTags[incrementLevel] // v1.2.4
  core.info(`Next tag: ${representativeNextTag}`)

  // Remove dist/ from .gitignore so it can be committed for the release.
  await exec.exec('sed', ['-i', '-E', 's|^/?dist/?||g', '.gitignore'])
  await exec.exec('git', ['add', '.'])
  await exec.exec('git', ['status'])
  await exec.exec('git', ['config', 'user.name', 'github-actions'])
  await exec.exec('git', ['config', 'user.email', 'github-actions@github.com'])
  await exec.exec('git', ['commit', '-m', `Release ${representativeNextTag}`])

  // Create and/or overwrite the tags associated with the next version.
  for (const tag of nextTagsArray) {
    await exec.exec('git', ['tag', '-f', tag])
  }

  if (currentTag !== undefined) {
    // If there's a current tag, compare the diff between the current tag and the next tag.
    // If there's no diff, return early without creating a release.
    const diffNames = await gitDiff(currentTag, representativeNextTag)
    if (!generatedFileChanged(diffNames)) {
      core.info('Nothing to release')
      return
    }
    core.info('Generated file(s) changed')
  }

  // Ignore pull request events.
  if (github.context.eventName === 'pull_request') {
    core.warning(`Next release is ${representativeNextTag}; ignoring pull request event ...`)
    return
  }

  // Push the tags.
  await exec.exec('git', ['push', 'origin', '-f', ...nextTagsArray])

  // Create a release.
  core.info(`Creating a release for tag ${representativeNextTag}`)
  const octokit = github.getOctokit(token)
  const { data: releaseNote } = await octokit.rest.repos.generateReleaseNotes({
    ...github.context.repo,
    tag_name: representativeNextTag,
    previous_tag_name: currentTag,
  })
  const { data: release } = await octokit.rest.repos.createRelease({
    ...github.context.repo,
    ...releaseNote,
    tag_name: representativeNextTag,
  })
  core.info(`Created release: ${release.html_url}`)
}

const findCurrentTag = async (majorVersion: number | undefined): Promise<string | undefined> => {
  const tags: string[] = []
  const tagFilter: string = majorVersion ? toTag(majorVersion) : VERSION_PREFIX
  await exec.exec('git', ['fetch', '--tags', '--prune-tags', '--prune'])
  await exec.exec('git', ['tag', '--list', '--contains', tagFilter], {
    listeners: { stdline: (l) => tags.push(l.trim()) },
    ignoreReturnCode: true,
  })
  // Match tags with formats v1.0.0, v1.0, v1.
  const currentTagPattern = new RegExp(`^${VERSION_PREFIX}\\d+(\\.\\d+)?(\\.\\d+)?$`)
  // ["v1.0.0", "v1.0", "v1", "v2.0.0", "v2.0", "v2"] => "v2.0.0"
  // ["v1.0.0", "v1.0", "v1", "v2.0", "v2"] => "v2.0"
  // ["v1.0.0", "v1.0", "v1", "v2"] => "v2"
  // ["v1.0.0", "v1.0", "v1"] => "v1.0.0"
  return tags
    .filter((tag) => currentTagPattern.test(tag))
    .sort()
    .pop()
}

const gitDiff = async (currentTag: string, nextTag: string) => {
  const diffNames: string[] = []
  await exec.exec('git', ['diff', '--name-only', currentTag, nextTag, '--'], {
    listeners: { stdline: (l) => diffNames.push(l.trim()) },
  })
  return diffNames
}

export const generatedFileChanged = (diffNames: string[]): boolean => {
  for (const diffName of diffNames) {
    const [parent, child] = diffName.split('/')
    if (parent === 'dist' || parent === 'action.yaml' || child === 'dist' || child === 'action.yaml') {
      return true
    }
  }
  return false
}
