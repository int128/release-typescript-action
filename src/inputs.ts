import * as core from '@actions/core'

export type IncrementLevel = 'major' | 'minor' | 'patch'

export type Inputs = {
  majorVersion?: number | undefined
  token: string
  incrementLevel: IncrementLevel
}

export const getInputs = (): Inputs => {
  const majorVersionInput = core.getInput('major-version', { required: false })
  const incrementLevel = core.getInput('increment-level', { required: true }) as IncrementLevel
  if (!['major', 'minor', 'patch'].includes(incrementLevel)) {
    throw new Error(`Invalid increment level: ${incrementLevel}`)
  }
  return {
    majorVersion: majorVersionInput ? parseInt(majorVersionInput) : undefined,
    incrementLevel,
    token: core.getInput('token', { required: true }),
  }
}
