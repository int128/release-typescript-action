import { findCurrentTag, isGeneratedFileChanged } from '../src/create'
import * as exec from '@actions/exec'

jest.mock('@actions/exec')

describe('isGeneratedFileChanged', () => {
  test('no diff', () => {
    expect(isGeneratedFileChanged([])).toBe(false)
  })

  test('action.yaml is changed', () => {
    const diffNames = ['action.yaml']
    expect(isGeneratedFileChanged(diffNames)).toBe(true)
  })

  test('action.yml is changed', () => {
    const diffNames = ['action.yml']
    expect(isGeneratedFileChanged(diffNames)).toBe(true)
  })

  test('dist is changed', () => {
    const diffNames = ['dist/index.js']
    expect(isGeneratedFileChanged(diffNames)).toBe(true)
  })

  test('nothing to release', () => {
    const diffNames = ['foo']
    expect(isGeneratedFileChanged(diffNames)).toBe(false)
  })
})

describe('isGeneratedFileChanged for monorepo', () => {
  test('action.yaml is changed', () => {
    const diffNames = ['hello/action.yaml']
    expect(isGeneratedFileChanged(diffNames)).toBe(true)
  })

  test('action.yml is changed', () => {
    const diffNames = ['hello/action.yml']
    expect(isGeneratedFileChanged(diffNames)).toBe(true)
  })

  test('dist is changed', () => {
    const diffNames = ['hello/dist/index.js']
    expect(isGeneratedFileChanged(diffNames)).toBe(true)
  })

  test('nothing to release', () => {
    const diffNames = ['hello/foo']
    expect(isGeneratedFileChanged(diffNames)).toBe(false)
  })
})

describe('findCurrentTag', () => {
  test('exact tag exists', async () => {
    jest.mocked(exec.getExecOutput).mockResolvedValue({ stdout: 'v1.0.0', stderr: '', exitCode: 0 })
    const currentTag = await findCurrentTag('v1')
    expect(currentTag).toBe('v1.0.0')
  })

  test('if multiple tags exist, it should return the last one', async () => {
    jest.mocked(exec.getExecOutput).mockResolvedValue({ stdout: 'v1.0.0-pre\nv1.0.0', stderr: '', exitCode: 0 })
    const currentTag = await findCurrentTag('v1')
    expect(currentTag).toBe('v1.0.0')
  })

  test('no tag exists', async () => {
    jest
      .mocked(exec.getExecOutput)
      .mockResolvedValue({ stdout: '', stderr: 'error: malformed object name v0', exitCode: 1 })
    const currentTag = await findCurrentTag('v1')
    expect(currentTag).toBeUndefined()
  })
})
