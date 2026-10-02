import dayjs from 'dayjs'
import { isNil } from '@activepieces/core-utils'
import { FlowAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { SampleDataSettings } from '../sample-data'
import { FlowTrigger, FlowTriggerType } from '../triggers/trigger'
import { flowStructureUtil } from '../util/flow-structure-util'
import { isDisplayNameOnlyUpdate } from './display-name-only-update'
import { UpdateTriggerRequest } from '.'


function createTrigger(name: string, request: UpdateTriggerRequest, nextAction: FlowAction | undefined, existingSampleData: SampleDataSettings | undefined, lastUpdatedDate: string): FlowTrigger {
    const baseProperties = {
        displayName: request.displayName,
        name,
        valid: false,
        nextAction,
        lastUpdatedDate,
    }
    let trigger: FlowTrigger
    switch (request.type) {
        case FlowTriggerType.EMPTY:
            trigger = {
                ...baseProperties,
                type: FlowTriggerType.EMPTY,
                settings: request.settings,
            }
            break
        case FlowTriggerType.PIECE:
            trigger = {
                ...baseProperties,
                type: FlowTriggerType.PIECE,
                settings: { ...request.settings, sampleData: existingSampleData },
            }
            break
    }
    const parseResult = FlowTrigger.safeParse(trigger)
    const valid = (isNil(request.valid) ? true : request.valid) && parseResult.success
    return {
        ...trigger,
        valid,
    }
}

function _updateTrigger(flowVersion: FlowVersion, request: UpdateTriggerRequest): FlowVersion {
    const trigger = flowStructureUtil.getStepOrThrow(request.name, flowVersion.trigger)
    const existingSampleData = trigger.type === FlowTriggerType.PIECE ? trigger.settings.sampleData : undefined
    const lastUpdatedDate = isDisplayNameOnlyUpdate(trigger, request) && !isNil(trigger.lastUpdatedDate)
        ? trigger.lastUpdatedDate
        : dayjs().toISOString()
    const updatedTrigger = createTrigger(request.name, request, trigger.nextAction, existingSampleData, lastUpdatedDate)
    const next = flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name === request.name) {
            return updatedTrigger
        }
        return parentStep
    })
    return next
}

export { _updateTrigger }
