import { computeNextTags } from '../src/semver'

test('a tag is given', () => {
  expect(computeNextTags('v1.1.0', 'minor', 1).patch).toBe('v1.2.0')
})

test('undefined is given', () => {
  expect(computeNextTags(undefined, 'minor', 1).patch).toBe('v1.0.0')
})

test('invalid tag is given', () => {
  expect(computeNextTags('v1.x.y', 'minor', 1).patch).toBe('v1.0.0')
})
