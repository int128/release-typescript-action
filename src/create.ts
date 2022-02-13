import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { computeNextTag } from './semver'

type Inputs = {
  majorVersion: number
  token: string
}

export const createNextMinorRelease = async (inputs: Inputs) => {
  const octokit = github.getOctokit(inputs.token)

  const majorTag = `v${inputs.majorVersion}`
  core.info(`Major tag is ${majorTag}`)
  const currentTag = await findCurrentTag(majorTag)
  core.info(`Current tag is ${currentTag ?? 'not found'}`)
  const nextTag = computeNextTag(currentTag, majorTag)
  core.info(`Next tag is ${nextTag}`)

  await exec.exec('sed', ['-i', '-e', 's|^/dist.*||g', '.gitignore'])
  await exec.exec('git', ['add', '.gitignore'])
  await exec.exec('git', ['add', 'dist'])
  await exec.exec('git', ['config', 'user.name', 'github-actions'])
  await exec.exec('git', ['config', 'user.email', 'github-actions@github.com'])
  await exec.exec('git', ['commit', '-m', `Release ${nextTag}`])
  await exec.exec('git', ['tag', nextTag])
  await exec.exec('git', ['tag', '-f', majorTag])

  if (currentTag !== undefined) {
    const code = await exec.exec('git', ['diff', '--exit-code', currentTag, nextTag, '--', 'dist'], {
      ignoreReturnCode: true,
    })
    if (code === 0) {
      core.info('Nothing to release')
      return
    }
  }
  if (github.context.eventName === 'pull_request') {
    core.warning(`Ignore pull_request event`)
    return
  }
  await exec.exec('git', ['push', 'origin', '-f', nextTag, majorTag])

  core.info(`Creating a release for tag ${nextTag}`)
  const { data: releaseNote } = await octokit.rest.repos.generateReleaseNotes({
    ...github.context.repo,
    tag_name: nextTag,
    previous_tag_name: currentTag,
  })
  const { data: release } = await octokit.rest.repos.createRelease({
    ...github.context.repo,
    ...releaseNote,
    tag_name: nextTag,
  })
  core.info(`Created a release as ${release.html_url}`)
}

const findCurrentTag = async (majorTag: string) => {
  const tags: string[] = []
  await exec.exec('git', ['fetch', '--tags', '--prune-tags', '--prune'])
  await exec.exec('git', ['tag', '--list', '--contains', majorTag], {
    listeners: {
      stdline: (l) => tags.push(l.trim()),
    },
    ignoreReturnCode: true,
  })
  return tags.filter((tag) => tag != majorTag).pop()
}
