import { generatedFileChanged } from '../src/create'

describe('generated file is changed in polyrepo', () => {
  test('no diff', () => {
    expect(generatedFileChanged([])).toBe(false)
  })

  test('action.yaml is changed', () => {
    const diffNames = ['action.yaml']
    expect(generatedFileChanged(diffNames)).toBe(true)
  })

  test('dist is changed', () => {
    const diffNames = ['dist/index.js']
    expect(generatedFileChanged(diffNames)).toBe(true)
  })

  test('nothing to release', () => {
    const diffNames = ['foo']
    expect(generatedFileChanged(diffNames)).toBe(false)
  })
})

describe('generated file is changed in monorepo', () => {
  test('action.yaml is changed', () => {
    const diffNames = ['hello/action.yaml']
    expect(generatedFileChanged(diffNames)).toBe(true)
  })

  test('dist is changed', () => {
    const diffNames = ['hello/dist/index.js']
    expect(generatedFileChanged(diffNames)).toBe(true)
  })

  test('nothing to release', () => {
    const diffNames = ['hello/foo']
    expect(generatedFileChanged(diffNames)).toBe(false)
  })
})
