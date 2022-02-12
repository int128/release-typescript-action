import { findLatestMinor } from '../src/semver'

test('a tag is given', () => {
  expect(findLatestMinor(['v1.1.0'], 1)).toBe(1)
})

test('tags are given', () => {
  expect(findLatestMinor(['v1.0.0', 'v1.1.0', 'v1.2.0'], 1)).toBe(2)
})

test('tags are given, including invalid one', () => {
  expect(findLatestMinor(['v1.0.0', 'v1.x.0', 'v1.2.0'], 1)).toBe(2)
})

test('tags are given, including different major', () => {
  expect(findLatestMinor(['v1.0.0', 'v2.3.0', 'v1.2.0'], 1)).toBe(2)
  expect(findLatestMinor(['v1.0.0', 'v2.3.0', 'v1.2.0'], 2)).toBe(3)
})

test('only major tag is given', () => {
  expect(findLatestMinor(['v1'], 1)).toBe(0)
})

test('only major tags are given', () => {
  expect(findLatestMinor(['v1', 'v2'], 1)).toBe(0)
})
