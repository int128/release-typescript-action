import { IncrementLevel } from './inputs'

export const VERSION_PREFIX = 'v'

interface Tags {
  patch: string
  minor: string
  major: string
}

export const computeNextTags = (
  currentTag: string | undefined,
  incrementLevel: IncrementLevel,
  defaultMajorVersion: number
): Tags => {
  if (currentTag === undefined)
    return {
      major: toTag(defaultMajorVersion),
      minor: toTag(`${defaultMajorVersion}.0`),
      patch: toTag(`${defaultMajorVersion}.0.0`),
    }
  const currentVersion = stripVersionPrefix(currentTag)
  const nextVersion = computeNextVersion(currentVersion, incrementLevel)
  const { major, minor } = parseVersion<true>(nextVersion)
  return {
    major: toTag(major),
    minor: toTag(`${major}.${minor}`),
    patch: toTag(nextVersion),
  }
}

const computeNextVersion = (currentVersion: string, incrementLevel: IncrementLevel): string => {
  const { major, minor, patch } = parseVersion(currentVersion)
  switch (incrementLevel) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      if (typeof minor === 'undefined') throw new Error('Unexpected undefined minor version')
      return `${major}.${minor + 1}.0`
    case 'patch':
      if (typeof minor === 'undefined') throw new Error('Unexpected undefined minor version')
      if (typeof patch === 'undefined') throw new Error('Unexpected undefined patch version')
      return `${major}.${minor}.${patch + 1}`
  }
}

// Given a version string (1.2.3), return the associated tags (v1, v1.2, v1.2.3)
export const computeTagsForVersion = (version: string): string[] => {
  const { major, minor, patch } = parseVersion(version)
  const tags = [toTag(major)]
  if (typeof minor !== 'undefined') {
    tags.push(toTag(`${major}.${minor}`))
    if (typeof patch !== 'undefined') {
      tags.push(toTag(`${major}.${minor}.${patch}`))
    }
  }
  return tags
}

export const stripVersionPrefix = (tag: string): string => tag.replace(VERSION_PREFIX, '')

// `Full` is true when the version is known to be complete (major.minor.patch).
interface ParsedVersion<Full extends boolean = false> {
  major: number
  minor: Full extends true ? number : number | undefined
  patch: Full extends true ? number : number | undefined
}

// `Full` is true when the version is known to be complete (major.minor.patch).
export function parseVersion<Full extends boolean = false>(version: string): ParsedVersion<Full> {
  const versionNumberArray = stripVersionPrefix(version)
    .split('.')
    .map((s) => parseInt(s))
  const major = versionNumberArray[0]
  const minor = versionNumberArray.length >= 2 ? versionNumberArray[1] : undefined
  const patch = versionNumberArray.length >= 3 ? versionNumberArray[2] : undefined
  return { major, minor, patch } as ParsedVersion<Full>
}

export const toTag = (version: number | string): string => {
  const versionString = String(version)
  return versionString.startsWith(VERSION_PREFIX) ? versionString : `${VERSION_PREFIX}${versionString}`
}

export const toVersion = (tag: string): string => {
  return stripVersionPrefix(tag)
}
