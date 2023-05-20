import { isGeneratedFileChanged } from '../src/create'

describe('generated file is changed in polyrepo', () => {
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

describe('generated file is changed in monorepo', () => {
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
