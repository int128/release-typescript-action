import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'

export const followUpCurrentTag = async () => {
  const currentTag = github.context.ref.substring('refs/tags/'.length)
  core.info(`Current tag is ${currentTag}`)
  if (!currentTag.startsWith('v')) {
    throw Error(`Tag name should start with v but was ${currentTag}`)
  }
  const [majorTag] = currentTag.split('.')
  core.info(`Major tag is ${majorTag}`)

  await exec.exec('sed', ['-i', '-E', 's|^/?dist/?||g', '.gitignore'])
  await exec.exec('git', ['add', '.'])
  if ((await gitStatus()) === '') {
    core.info(`Current tag is up-to-date`)
    return
  }

  await exec.exec('git', ['config', 'user.name', 'github-actions'])
  await exec.exec('git', ['config', 'user.email', 'github-actions@github.com'])
  await exec.exec('git', ['commit', '-m', `Release ${currentTag}`])
  await exec.exec('git', ['tag', '-f', currentTag])
  await exec.exec('git', ['tag', '-f', majorTag])
  await exec.exec('git', ['push', 'origin', '-f', currentTag, majorTag])
}

const gitStatus = async (): Promise<string> => {
  const chunks: Buffer[] = []
  await exec.exec('git', ['status', '--porcelain'], { listeners: { stdout: (b) => chunks.push(b) } })
  return Buffer.concat(chunks).toString().trim()
}
