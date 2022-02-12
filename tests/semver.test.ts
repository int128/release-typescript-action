import { computeNextTag } from '../src/semver'

test('a tag is given', () => {
  expect(computeNextTag('v1.1.0', 'v1')).toBe('v1.2.0')
})

test('undefined is given', () => {
  expect(computeNextTag(undefined, 'v1')).toBe('v1.1.0')
})

test('invalid tag is given', () => {
  expect(computeNextTag('v1.x.y', 'v1')).toBe('v1.1.0')
})
