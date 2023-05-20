export type Level = 'minor' | 'patch'

export const computeNextTag = (currentTag: string | undefined, majorTag: string, level: Level): string => {
  if (currentTag === undefined) {
    return `${majorTag}.0.0`
  }
  if (level === 'patch') {
    return computeNextPatchTag(currentTag, majorTag)
  }
  return computeNextMinorTag(currentTag, majorTag)
}

const computeNextMinorTag = (currentTag: string, majorTag: string): string => {
  const currentTagComponents = currentTag.split('.')
  if (currentTagComponents.length < 2) {
    throw new Error(`current tag ${currentTag} does not have minor component`)
  }
  const minorNumber = parseInt(currentTagComponents[1])
  if (!Number.isSafeInteger(minorNumber)) {
    throw new Error(`current tag ${currentTag} does not have a valid minor number`)
  }
  return `${majorTag}.${minorNumber + 1}.0`
}

const computeNextPatchTag = (currentTag: string, majorTag: string): string => {
  const currentTagComponents = currentTag.split('.')
  if (currentTagComponents.length < 3) {
    throw new Error(`current tag ${currentTag} does not have patch component`)
  }
  const minor = currentTagComponents[1]
  const patchNumber = parseInt(currentTagComponents[2])
  if (!Number.isSafeInteger(patchNumber)) {
    throw new Error(`current tag ${currentTag} does not have a valid patch number`)
  }
  return `${majorTag}.${minor}.${patchNumber + 1}`
}
