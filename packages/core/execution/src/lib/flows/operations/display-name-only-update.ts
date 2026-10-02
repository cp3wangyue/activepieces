import { isNil } from '@activepieces/core-utils'

interface ExistingStep {
    name: string
    type: unknown
    valid: boolean
    skip?: boolean
    settings: object
}

interface UpdateStepRequest {
    name: string
    type: unknown
    valid?: boolean
    skip?: boolean
    settings: object
}

function omitSampleData(settings: object): Record<string, unknown> {
    const { sampleData: _sampleData, ...rest } = settings as Record<string, unknown>
    return rest
}

function deepEquals(left: unknown, right: unknown): boolean {
    if (left === right) {
        return true
    }
    if (isNil(left) || isNil(right) || typeof left !== 'object' || typeof right !== 'object') {
        return false
    }
    if (Array.isArray(left) !== Array.isArray(right)) {
        return false
    }
    const leftRecord = left as Record<string, unknown>
    const rightRecord = right as Record<string, unknown>
    const leftKeys = Object.keys(leftRecord)
    const rightKeys = Object.keys(rightRecord)
    if (leftKeys.length !== rightKeys.length) {
        return false
    }
    return leftKeys.every((key) => deepEquals(leftRecord[key], rightRecord[key]))
}

export function isDisplayNameOnlyUpdate(existingStep: ExistingStep, request: UpdateStepRequest): boolean {
    if (existingStep.type !== request.type || existingStep.name !== request.name) {
        return false
    }
    const validUnchanged = isNil(request.valid) || request.valid === existingStep.valid
    const skipUnchanged = isNil(request.skip) || request.skip === existingStep.skip
    return validUnchanged && skipUnchanged && deepEquals(omitSampleData(existingStep.settings), omitSampleData(request.settings))
}
