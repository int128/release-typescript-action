export const computeNextTag = (currentTag: string | undefined, majorTag: string): string => {
  if (currentTag === undefined) {
    return `${majorTag}.0.0`
  }
  const [, minor] = currentTag.split('.')
  const minorNumber = parseInt(minor)
  if (!Number.isSafeInteger(minorNumber)) {
    return `${majorTag}.0.0`
  }
  return `${majorTag}.${minorNumber + 1}.0`
}
