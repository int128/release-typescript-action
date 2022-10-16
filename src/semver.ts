import { IncrementLevel } from './inputs'

export const VERSION_PREFIX = 'v'

interface Tags {
  major: string
  minor: string
  patch: string
}

export function computeNextTags<TIncrementLevel extends IncrementLevel> (
  currentTag: string | undefined,
  incrementLevel: TIncrementLevel,
  defaultMajorVersion: number
): Tags {
  if (currentTag === undefined)
    return {
      major: toTag(defaultMajorVersion),
      minor: toTag(`${defaultMajorVersion}.0`),
      patch: toTag(`${defaultMajorVersion}.0.0`),
    }
  const currentVersion = toVersion(currentTag);
  const nextVersion = computeNextVersion(currentVersion, incrementLevel)
  return computeTagsForVersion(nextVersion)
}

/*
  Given a version string like `1` or `v1`, return a full version string like `1.0.0`.
  This could help in cases where the user has manually created a tag like `v1`
  (without a minor or patch version) before using this action.
*/
export const dangerouslyExpandVersion = (currentVersion: string): string => {
  const { major, minor, patch } = parseVersion(currentVersion);
  return `${major}.${minor ?? 0}.${patch ?? 0}`;
};

/*
  Given the current version and increment level, 
  return the next version in full major.minor.patch format.
*/
const computeNextVersion = (currentVersion: string, incrementLevel: IncrementLevel): string => {
  const { major, minor, patch } = parseVersion<true>(dangerouslyExpandVersion(currentVersion));
  switch (incrementLevel) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      // if (typeof minor === 'undefined') throw new Error('Unexpected undefined minor version')
      return `${major}.${minor + 1}.0`
    case 'patch':
      // if (typeof minor === 'undefined') throw new Error('Unexpected undefined minor version')
      // if (typeof patch === 'undefined') throw new Error('Unexpected undefined patch version')
      return `${major}.${minor}.${patch + 1}`
  }
}

// Given a version string (1.2.3), return the associated tags (v1, v1.2, v1.2.3)
export const computeTagsForVersion = (version: string): Tags => {
  const { major: majorVersion, minor: minorVersion, patch: patchVersion } = parseVersion(version)
  const tags: Tags = {
    major: toTag(majorVersion),
    minor: toTag(`${majorVersion}.${minorVersion ?? 0}`),
    patch: toTag(`${majorVersion}.${minorVersion ?? 0}.${patchVersion ?? 0}`),
  }
  return tags
}

// `Full` is true when the version is known to be complete (major.minor.patch).
interface ParsedVersion<Full extends boolean = false> {
  major: number
  minor: Full extends true ? number : number | undefined
  patch: Full extends true ? number : number | undefined
}
export function parseVersion<Full extends boolean = false>(version: string): ParsedVersion<Full> {
  const versionNumberArray = stripVersionPrefix(version)
    .split('.')
    .map((s) => parseInt(s))
  const major = versionNumberArray[0]
  const minor = versionNumberArray.length >= 2 ? versionNumberArray[1] : undefined
  const patch = versionNumberArray.length >= 3 ? versionNumberArray[2] : undefined
  return { major, minor, patch } as ParsedVersion<Full>
}

export const stripVersionPrefix = (tag: string): string => tag.replace(VERSION_PREFIX, '')

/*
  Given a version string, return the tag form.
  1 --> v1
  1.2.3 --> v1.2.3
  v1.2.3 --> v1.2.3
*/
export const toTag = (version: number | string): string => {
  const versionString = String(version)
  return versionString.startsWith(VERSION_PREFIX) ? versionString : `${VERSION_PREFIX}${versionString}`
}

/* 
  Given a tag, return the version string with no prefix.
  v1 --> 1
  v1.2.3 --> 1.2.3
  1.2.3 --> 1.2.3
*/
export const toVersion = (tag: string): string => {
  return stripVersionPrefix(tag)
}
