import { computeNextTag } from '../src/semver.js'

describe('bump the minor version', () => {
  test('a tag is given', () => {
    expect(computeNextTag('v1.2.3', 'v1', 'minor')).toBe('v1.3.0')
  })

  test.each([
    ['v1.0.0', 'v1.1.0'],
    ['v1.0.1', 'v1.1.0'],
    ['v1.1.0', 'v1.2.0'],
    ['v1.1.1', 'v1.2.0'],
    ['v1.2.0', 'v1.3.0'],
    ['v1.2.1', 'v1.3.0'],
    ['v1.999.0', 'v1.1000.0'],
    ['v1.999.999', 'v1.1000.0'],
    ['v1.0.0-alpha', 'v1.1.0'],
    ['v1.0.0+20130313144700', 'v1.1.0'],
  ])('computeNextTag(%s)', (currentTag, nextTag) => {
    expect(computeNextTag(currentTag, 'v1', 'minor')).toBe(nextTag)
  })

  test('current tag is undefined', () => {
    expect(computeNextTag(undefined, 'v1', 'minor')).toBe('v1.0.0')
  })

  test('current tag is invalid', () => {
    expect(() => computeNextTag('v1.x.y', 'v1', 'minor')).toThrow(/current tag/)
  })
})

describe('bump the patch version', () => {
  test('a tag is given', () => {
    expect(computeNextTag('v1.2.0', 'v1', 'patch')).toBe('v1.2.1')
  })

  test.each([
    ['v1.0.0', 'v1.0.1'],
    ['v1.0.1', 'v1.0.2'],
    ['v1.1.0', 'v1.1.1'],
    ['v1.1.1', 'v1.1.2'],
    ['v1.2.0', 'v1.2.1'],
    ['v1.2.1', 'v1.2.2'],
    ['v1.999.0', 'v1.999.1'],
    ['v1.999.999', 'v1.999.1000'],
    ['v1.0.0-alpha', 'v1.0.1'],
    ['v1.0.0+20130313144700', 'v1.0.1'],
  ])('computeNextTag(%s)', (currentTag, nextTag) => {
    expect(computeNextTag(currentTag, 'v1', 'patch')).toBe(nextTag)
  })

  test('current tag is undefined', () => {
    expect(computeNextTag(undefined, 'v1', 'patch')).toBe('v1.0.0')
  })

  test('current tag is invalid', () => {
    expect(() => computeNextTag('v1.x.y', 'v1', 'patch')).toThrow(/current tag/)
  })
})
