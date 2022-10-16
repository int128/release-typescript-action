import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { computeTagsForVersion, toVersion } from './semver'

export const followUpCurrentTag = async () => {
  const currentTag = github.context.ref.substring('refs/tags/'.length)
  core.info(`Current tag: ${currentTag}`)
  if (!currentTag.startsWith('v')) {
    throw Error(`Tag name should start with v but was ${currentTag}`)
  }
  const currentVersion = toVersion(currentTag)
  const tagsToUpdate = computeTagsForVersion(currentVersion)
  const tagsToUpdateString = tagsToUpdate.join(', ')
  core.info(`Tags to update: ${tagsToUpdateString}`)

  await exec.exec('sed', ['-i', '-E', 's|^/?dist/?||g', '.gitignore'])
  await exec.exec('git', ['add', '.'])
  if ((await gitStatus()) === '') {
    core.info(`Current tag is up-to-date`)
    return
  }

  await exec.exec('git', ['config', 'user.name', 'github-actions'])
  await exec.exec('git', ['config', 'user.email', 'github-actions@github.com'])
  await exec.exec('git', ['commit', '-m', `Release ${currentTag}`])
  for (const tag of tagsToUpdate) {
    await exec.exec('git', ['tag', '-f', tag])
  }
  await exec.exec('git', ['push', 'origin', '-f', ...tagsToUpdate])
}

const gitStatus = async (): Promise<string> => {
  const chunks: Buffer[] = []
  await exec.exec('git', ['status', '--porcelain'], { listeners: { stdout: (b) => chunks.push(b) } })
  return Buffer.concat(chunks).toString().trim()
}
