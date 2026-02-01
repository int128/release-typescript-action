import * as exec from '@actions/exec'
import { describe, expect, test, vi } from 'vitest'
import { findCurrentTag } from '../src/create.js'

vi.mock('@actions/exec')

describe('findCurrentTag', () => {
  test('exact tag exists', async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({ stdout: 'v1.0.0', stderr: '', exitCode: 0 })
    const currentTag = await findCurrentTag('v1')
    expect(currentTag).toBe('v1.0.0')
  })

  test('if multiple tags exist, it should return the last one', async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({ stdout: 'v1.0.0-pre\nv1.0.0', stderr: '', exitCode: 0 })
    const currentTag = await findCurrentTag('v1')
    expect(currentTag).toBe('v1.0.0')
  })

  test('no tag exists', async () => {
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      stdout: '',
      stderr: 'error: malformed object name v0',
      exitCode: 1,
    })
    const currentTag = await findCurrentTag('v1')
    expect(currentTag).toBeUndefined()
  })
})
