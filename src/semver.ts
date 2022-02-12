export const computeNextTag = (currentTag: string | undefined, majorTag: string): string => {
  if (currentTag === undefined) {
    return `${majorTag}.1.0`
  }
  const [, minor] = currentTag.split('.')
  let minorNumber = parseInt(minor)
  if (!Number.isSafeInteger(minorNumber)) {
    minorNumber = 0
  }
  return `${majorTag}.${minorNumber + 1}.0`
}
