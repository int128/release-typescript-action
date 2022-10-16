import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { computeNextTags, toTag, VERSION_PREFIX } from './semver'
import { Inputs } from './inputs'

const DEFAULT_MAJOR_VERSION = 1

export const createNextRelease = async ({ majorVersion, incrementLevel, token }: Inputs) => {
  const currentTag = await findCurrentTag(majorVersion)
  core.info(`Current tag: ${currentTag ?? 'not found'}`)
  core.info(`Increment level: ${incrementLevel}`)
  const nextTags = computeNextTags(currentTag, incrementLevel, majorVersion ?? DEFAULT_MAJOR_VERSION)
  const nextTagsArray = Object.values(nextTags) as string[]
  const representativeNextTag = nextTags[incrementLevel]
  core.info(`Next tag: ${representativeNextTag}`)

  await exec.exec('sed', ['-i', '-E', 's|^/?dist/?||g', '.gitignore'])
  await exec.exec('git', ['add', '.'])
  await exec.exec('git', ['status'])
  await exec.exec('git', ['config', 'user.name', 'github-actions'])
  await exec.exec('git', ['config', 'user.email', 'github-actions@github.com'])
  await exec.exec('git', ['commit', '-m', `Release ${representativeNextTag}`])
  for (const tag of nextTagsArray) {
    await exec.exec('git', ['tag', '-f', tag])
  }

  if (currentTag !== undefined) {
    const diffNames = await gitDiff(currentTag, representativeNextTag)
    if (!generatedFileChanged(diffNames)) {
      core.info('Nothing to release')
      return
    }
    core.info('Generated file(s) is changed')
  }
  if (github.context.eventName === 'pull_request') {
    core.warning(`Next release is ${representativeNextTag}; ignoring pull request event ...`)
    return
  }
  await exec.exec('git', ['push', 'origin', '-f', ...nextTagsArray])

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
    listeners: {
      stdline: (l) => tags.push(l.trim()),
    },
    ignoreReturnCode: true,
  })
  const currentTagPattern = new RegExp(`^${VERSION_PREFIX}(\\d+)\\.(\\d+)\\.(\\d+)$`)
  return tags.filter((tag) => currentTagPattern.test(tag)).pop()
}

const gitDiff = async (currentTag: string, nextTag: string) => {
  const diffNames: string[] = []
  await exec.exec('git', ['diff', '--name-only', currentTag, nextTag, '--'], {
    listeners: {
      stdline: (l) => diffNames.push(l.trim()),
    },
  })
  return diffNames
}

export const generatedFileChanged = (diffNames: string[]): boolean => {
  for (const diffName of diffNames) {
    const [parent, child] = diffName.split('/')
    if (parent === 'dist' || parent === 'action.yaml') {
      return true
    }
    if (child === 'dist' || child === 'action.yaml') {
      return true
    }
  }
  return false
}
