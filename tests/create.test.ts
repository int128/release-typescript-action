import * as exec from '@actions/exec'
import { describe, expect, it, vi } from 'vitest'
import { findCurrentTag } from '../src/create.js'

vi.mock('@actions/exec')

describe('findCurrentTag', () => {
  it('returns the exact tag if it exists', async () => {
    vi.mocked(exec.exec).mockResolvedValue(0)
    vi.mocked(exec.getExecOutput).mockResolvedValue({ stdout: 'v1.0.0', stderr: '', exitCode: 0 })

    const currentTag = await findCurrentTag('v1')
    expect(currentTag).toBe('v1.0.0')
    expect(exec.exec).toHaveBeenCalledWith('git', ['rev-parse', '--verify', 'refs/tags/v1'], { ignoreReturnCode: true })
  })

  it('throws an error if the major tag does not point to any version tag', async () => {
    vi.mocked(exec.exec).mockResolvedValue(0)
    vi.mocked(exec.getExecOutput).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

    await expect(findCurrentTag('v1')).rejects.toThrow(`The major tag v1 does not point to any version tag`)
    expect(exec.exec).toHaveBeenCalledWith('git', ['rev-parse', '--verify', 'refs/tags/v1'], { ignoreReturnCode: true })
  })

  it('throws an error if multiple tags exist', async () => {
    vi.mocked(exec.exec).mockResolvedValue(0)
    vi.mocked(exec.getExecOutput).mockResolvedValue({ stdout: 'v1.0.0-pre\nv1.0.0', stderr: '', exitCode: 0 })

    await expect(findCurrentTag('v1')).rejects.toThrow(
      `The major tag v1 points to multiple version tags: v1.0.0-pre, v1.0.0`,
    )
    expect(exec.exec).toHaveBeenCalledWith('git', ['rev-parse', '--verify', 'refs/tags/v1'], { ignoreReturnCode: true })
  })

  it('returns undefined if no tag exists', async () => {
    // "git rev-parse --verify refs/tags/nonexistent-tag" returns 128
    vi.mocked(exec.exec).mockResolvedValue(128)

    const currentTag = await findCurrentTag('v1')
    expect(currentTag).toBeUndefined()
    expect(exec.exec).toHaveBeenCalledWith('git', ['rev-parse', '--verify', 'refs/tags/v1'], { ignoreReturnCode: true })
  })
})
