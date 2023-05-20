export type Level = 'minor' | 'patch'

export const computeNextTag = (currentTag: string | undefined, majorTag: string, level: Level): string => {
  if (currentTag === undefined) {
    return `${majorTag}.0.0`
  }
  // https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
  const currentTagMatcher = currentTag.match(/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/)
  if (!currentTagMatcher) {
    throw new Error(`current tag ${currentTag} is not in form of v0.0.0`)
  }
  const [, , minor, patch] = currentTagMatcher
  if (level === 'patch') {
    const patchNumber = parseInt(patch)
    return `${majorTag}.${minor}.${patchNumber + 1}`
  }
  const minorNumber = parseInt(minor)
  return `${majorTag}.${minorNumber + 1}.0`
}
