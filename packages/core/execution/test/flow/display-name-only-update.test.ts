import { describe, expect, it } from 'vitest'
import { FlowActionType } from '../../src/lib/flows/actions/action'
import { FlowVersion, FlowVersionState } from '../../src/lib/flows/flow-version'
import { flowOperations, FlowOperationType, UpdateActionRequest, UpdateTriggerRequest } from '../../src/lib/flows/operations'
import { SampleDataSettings } from '../../src/lib/flows/sample-data'
import { flowStructureUtil } from '../../src/lib/flows/util/flow-structure-util'
import { FlowTriggerType } from '../../src/lib/flows/triggers/trigger'

const ORIGINAL_DATE = '2026-09-01T10:00:00.000Z'

const codeSettings = {
    sourceCode: {
        packageJson: '{}',
        code: 'export const code = async (inputs) => { return true; }',
    },
    input: {},
}

function codeStep(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        name: 'step_1',
        displayName: 'Step 1',
        valid: true,
        type: FlowActionType.CODE,
        settings: { ...codeSettings },
        lastUpdatedDate: ORIGINAL_DATE,
        nextAction: undefined,
        ...overrides,
    }
}

function flowWithCodeAction(stepOverrides: Record<string, unknown> = {}): FlowVersion {
    return {
        id: 'v1',
        flowId: 'f1',
        displayName: 'test',
        valid: true,
        state: FlowVersionState.DRAFT,
        schemaVersion: '27',
        updatedBy: null,
        created: '',
        updated: '',
        trigger: {
            name: 'trigger',
            displayName: 'Trigger',
            valid: true,
            type: FlowTriggerType.EMPTY,
            settings: {},
            lastUpdatedDate: ORIGINAL_DATE,
            nextAction: codeStep(stepOverrides),
        },
    } as FlowVersion
}

function flowWithEmptyTrigger(): FlowVersion {
    return {
        id: 'v1',
        flowId: 'f1',
        displayName: 'test',
        valid: true,
        state: FlowVersionState.DRAFT,
        schemaVersion: '27',
        updatedBy: null,
        created: '',
        updated: '',
        trigger: {
            name: 'trigger',
            displayName: 'Trigger',
            valid: true,
            type: FlowTriggerType.EMPTY,
            settings: {},
            lastUpdatedDate: ORIGINAL_DATE,
            nextAction: undefined,
        },
    } as FlowVersion
}

function updateActionRequest(overrides: Partial<UpdateActionRequest> = {}): UpdateActionRequest {
    return {
        type: FlowActionType.CODE,
        name: 'step_1',
        displayName: 'Step 1',
        valid: true,
        settings: { ...codeSettings },
        ...overrides,
    } as UpdateActionRequest
}

describe('update action operation', () => {
    it('keeps lastUpdatedDate when only the displayName changes', () => {
        const updated = flowOperations.apply(flowWithCodeAction(), {
            type: FlowOperationType.UPDATE_ACTION,
            request: updateActionRequest({ displayName: 'Renamed Step' }),
        })
        const step = flowStructureUtil.getActionOrThrow('step_1', updated.trigger)
        expect(step.displayName).toBe('Renamed Step')
        expect(step.lastUpdatedDate).toBe(ORIGINAL_DATE)
        expect(step.valid).toBe(true)
    })

    it('keeps lastUpdatedDate when the request only omits sampleData', () => {
        const sampleData: SampleDataSettings = { lastTestDate: '2026-09-02T10:00:00.000Z' }
        const updated = flowOperations.apply(flowWithCodeAction({ settings: { ...codeSettings, sampleData } }), {
            type: FlowOperationType.UPDATE_ACTION,
            request: updateActionRequest({ displayName: 'Renamed Step' }),
        })
        const step = flowStructureUtil.getActionOrThrow('step_1', updated.trigger)
        expect(step.lastUpdatedDate).toBe(ORIGINAL_DATE)
        expect(step.settings.sampleData).toEqual(sampleData)
    })

    it('keeps lastUpdatedDate when nothing but sampleData changes', () => {
        const updated = flowOperations.apply(flowWithCodeAction(), {
            type: FlowOperationType.UPDATE_ACTION,
            request: updateActionRequest(),
        })
        const step = flowStructureUtil.getActionOrThrow('step_1', updated.trigger)
        expect(step.lastUpdatedDate).toBe(ORIGINAL_DATE)
    })

    it('refreshes lastUpdatedDate when settings change alongside the displayName', () => {
        const updated = flowOperations.apply(flowWithCodeAction(), {
            type: FlowOperationType.UPDATE_ACTION,
            request: updateActionRequest({
                displayName: 'Renamed Step',
                settings: { ...codeSettings, input: { value: 42 } },
            }),
        })
        const step = flowStructureUtil.getActionOrThrow('step_1', updated.trigger)
        expect(step.displayName).toBe('Renamed Step')
        expect(step.lastUpdatedDate).not.toBe(ORIGINAL_DATE)
        expect(step.settings.input).toEqual({ value: 42 })
    })

    it('refreshes lastUpdatedDate when validity changes', () => {
        const updated = flowOperations.apply(flowWithCodeAction(), {
            type: FlowOperationType.UPDATE_ACTION,
            request: updateActionRequest({ valid: false }),
        })
        const step = flowStructureUtil.getActionOrThrow('step_1', updated.trigger)
        expect(step.lastUpdatedDate).not.toBe(ORIGINAL_DATE)
        expect(step.valid).toBe(false)
    })
})

describe('update trigger operation', () => {
    it('keeps lastUpdatedDate when only the displayName changes', () => {
        const updated = flowOperations.apply(flowWithEmptyTrigger(), {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                type: FlowTriggerType.EMPTY,
                name: 'trigger',
                displayName: 'Renamed Trigger',
                valid: true,
                settings: {},
            } as UpdateTriggerRequest,
        })
        expect(updated.trigger.displayName).toBe('Renamed Trigger')
        expect(updated.trigger.lastUpdatedDate).toBe(ORIGINAL_DATE)
        expect(updated.trigger.valid).toBe(true)
    })

    it('refreshes lastUpdatedDate when settings change alongside the displayName', () => {
        const updated = flowOperations.apply(flowWithEmptyTrigger(), {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                type: FlowTriggerType.EMPTY,
                name: 'trigger',
                displayName: 'Renamed Trigger',
                valid: true,
                settings: { someSetting: true },
            } as UpdateTriggerRequest,
        })
        expect(updated.trigger.displayName).toBe('Renamed Trigger')
        expect(updated.trigger.lastUpdatedDate).not.toBe(ORIGINAL_DATE)
    })
})
