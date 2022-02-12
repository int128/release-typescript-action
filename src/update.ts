import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'

type Inputs = {
  dryRun: boolean
}

export const updateCurrentTag = async (inputs: Inputs) => {
  const currentTag = github.context.ref.substring('tags/'.length)
  core.info(`Current tag is ${currentTag}`)
  if (!currentTag.startsWith('v')) {
    throw Error(`Tag name should start with v but was ${currentTag}`)
  }
  const [majorTag] = currentTag.split('.')
  core.info(`Major tag is ${majorTag}`)

  await exec.exec('sed', ['-i', '-e', 's|^/dist.*||g', '.gitignore'])
  await exec.exec('git', ['add', '.gitignore'])
  await exec.exec('git', ['add', 'dist'])
  if ((await gitStatus()) === '') {
    core.info(`Nothing to commit`)
    return
  }

  await exec.exec('git', ['config', 'user.name', 'github-actions'])
  await exec.exec('git', ['config', 'user.email', 'github-actions@github.com'])
  await exec.exec('git', ['commit', '-m', `Release ${currentTag}`])
  if (inputs.dryRun) {
    core.info(`Exit due to dry-run`)
    return
  }

  await exec.exec('git', ['tag', '-f', currentTag])
  await exec.exec('git', ['tag', '-f', majorTag])
  await exec.exec('git', ['push', 'origin', '-f', currentTag, majorTag])
}

const gitStatus = async (): Promise<string> => {
  const chunks: Buffer[] = []
  await exec.exec('git', ['status', '--porcelain'], { listeners: { stdout: (b) => chunks.push(b) } })
  return Buffer.concat(chunks).toString().trim()
}
