import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { findLatestMinor } from './semver'

type Inputs = {
  majorVersion: number
  token: string
  dryRun: boolean
}

export const run = async (inputs: Inputs): Promise<void> => {
  if (github.context.ref.startsWith('tags/')) {
    core.info('Updating the current tag if generated files are different')
    return updateCurrentTag(inputs)
  }
  core.info('Creating the next release')
  return createNextMinorRelease(inputs)
}

const updateCurrentTag = async (inputs: Inputs) => {
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

const createNextMinorRelease = async (inputs: Inputs) => {
  const tags = await getTags()
  core.info(`Found ${tags.length} tags`)
  const latestMinor = findLatestMinor(tags, inputs.majorVersion)
  core.info(`Latest minor is ${latestMinor}`)
  const majorTag = `v${inputs.majorVersion}`
  core.info(`Major tag is ${majorTag}`)
  const nextTag = `v${inputs.majorVersion}.${latestMinor + 1}.0`
  core.info(`Next tag is ${nextTag}`)

  await exec.exec('sed', ['-i', '-e', 's|^/dist.*||g', '.gitignore'])
  await exec.exec('git', ['add', '.gitignore'])
  await exec.exec('git', ['add', 'dist'])
  if ((await gitStatus()) === '') {
    core.info(`Nothing to commit`)
    return
  }

  await exec.exec('git', ['config', 'user.name', 'github-actions'])
  await exec.exec('git', ['config', 'user.email', 'github-actions@github.com'])
  await exec.exec('git', ['commit', '-m', `Release ${nextTag}`])
  if (inputs.dryRun) {
    core.info(`Exit due to dry-run`)
    return
  }

  await exec.exec('git', ['tag', nextTag])
  await exec.exec('git', ['tag', '-f', majorTag])
  await exec.exec('git', ['push', 'origin', '-f', nextTag, majorTag])

  const octokit = github.getOctokit(inputs.token)
  core.info(`Creating a release for tag ${nextTag}`)
  const { data: release } = await octokit.rest.repos.createRelease({
    ...github.context.repo,
    tag_name: nextTag,
    name: nextTag,
    generate_release_notes: true,
  })
  core.info(`Created a release as ${release.html_url}`)
}

const getTags = async () => {
  const tags: string[] = []
  await exec.exec('git', ['fetch', '--tags', '--prune-tags', '--prune'])
  await exec.exec('git', ['tag'], {
    listeners: {
      stdline: (l) => tags.push(l.trim()),
    },
  })
  return tags
}

const gitStatus = async (): Promise<string> => {
  const chunks: Buffer[] = []
  await exec.exec('git', ['status', '--porcelain'], { listeners: { stdout: (b) => chunks.push(b) } })
  return Buffer.concat(chunks).toString().trim()
}
