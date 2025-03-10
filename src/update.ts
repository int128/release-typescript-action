import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'

export const followUpCurrentTag = async () => {
  const currentTag = github.context.ref.substring('refs/tags/'.length)
  core.info(`Current tag is ${currentTag}`)
  if (!currentTag.startsWith('v')) {
    throw Error(`Tag name should start with v but was ${currentTag}`)
  }

  await exec.exec('sed', ['-i', '-E', 's|^/?dist/?||g', '.gitignore'])
  await exec.exec('rm', ['-fr', '.github/workflows'])

  await exec.exec('git', ['add', '.'])
  if ((await gitStatus()) === '') {
    core.info(`Current tag is up-to-date`)
    return
  }

  await exec.exec('git', ['config', 'user.name', 'github-actions'])
  await exec.exec('git', ['config', 'user.email', 'github-actions@github.com'])
  await exec.exec('git', ['commit', '-m', `Release ${currentTag}`])
  await exec.exec('git', ['tag', '-f', currentTag])
}

const gitStatus = async (): Promise<string> => {
  const { stdout } = await exec.getExecOutput('git', ['status', '--porcelain'])
  return stdout.trim()
}
