// Find the latest minor version in the tags.
export const findLatestMinor = (tags: string[], major: number): number => {
  const minors = tags
    .filter((tag) => tag.startsWith(`v${major}.`))
    .map((tag) => {
      const [, minor] = tag.split('.')
      const minorNumber = parseInt(minor)
      if (!Number.isSafeInteger(minorNumber)) {
        return 0
      }
      return minorNumber
    })
  return Math.max(0, ...minors)
}
