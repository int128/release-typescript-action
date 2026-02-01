import * as exec from '@actions/exec'
import type { Octokit } from '@octokit/action'
import type { Context } from './github.js'

export const commitCurrentChanges = async (message: string, context: Context) => {
  await exec.exec('git', ['add', '.'])
  await exec.exec('git', ['status', '--porcelain'])
  await exec.exec('git', ['config', 'user.name', 'github-actions'])
  await exec.exec('git', ['config', 'user.email', 'actions@github.com'])
  await exec.exec('git', [
    'commit',
    '-m',
    message,
    '--trailer',
    `Auto-Generated-By: release-typescript-action; ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
  ])
}

export const signCurrentCommit = async (octokit: Octokit, context: Context) => {
  const unsignedCommitSHA = await getCurrentSHA()
  const signingBranch = `signing--${unsignedCommitSHA}`
  await exec.exec('git', ['push', 'origin', `${unsignedCommitSHA}:refs/heads/${signingBranch}`])
  try {
    const { data: unsignedCommit } = await octokit.rest.git.getCommit({
      owner: context.repo.owner,
      repo: context.repo.repo,
      commit_sha: unsignedCommitSHA,
    })
    const { data: signedCommit } = await octokit.rest.git.createCommit({
      owner: context.repo.owner,
      repo: context.repo.repo,
      message: unsignedCommit.message,
      tree: unsignedCommit.tree.sha,
      parents: unsignedCommit.parents.map((parent) => parent.sha),
    })
    await octokit.rest.git.updateRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: `heads/${signingBranch}`,
      sha: signedCommit.sha,
      force: true,
    })
    await exec.exec('git', ['fetch', 'origin', '--depth=1', signedCommit.sha])
    await exec.exec('git', ['checkout', signedCommit.sha])
  } finally {
    await exec.exec('git', ['push', 'origin', '--delete', `refs/heads/${signingBranch}`])
  }
}

const getCurrentSHA = async (): Promise<string> => {
  const { stdout } = await exec.getExecOutput('git', ['rev-parse', 'HEAD'])
  return stdout.trim()
}
