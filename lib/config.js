import {isArray} from 'lodash'
import {assertSpec} from './helpers'

function normalizeFields(validationName, fields) {
  let result = fields
  if (result == null) {
    result = [validationName]
  }
  if (typeof result === 'string') {
    result = [result]
  }
  if (isArray(result) && (result.length === 0 || typeof result[0] === 'string')) {
    result = [result, result]
  }
  let wellFormed = isArray(result) &&
    result.length === 2 &&
    result.every((i) => isArray(i)) &&
    result[0].every((i) => typeof i === 'string') &&
    result[1].every((i) => typeof i === 'string')
  assertSpec(
    wellFormed,
    `Invalid validation config! Malformed fields for validation ${validationName}.`,
    fields,
    'Array<Array<string>> of length 2 or Array<string> or string or null'
  )
  // result has form [dependsOn, needTouch]
  //   dependsOn: Array<string>, field names that hide the validation result if
  //   the user is changing any of them (typing)
  //   needTouch: Array<string>, field names that need to be touched
  //   (changed/blurred/submitted) before the validation result is shown
  return result
}

function normalizeRules(validationName, rules) {
  assertSpec(
    isArray(rules) && rules.every((r) => isArray(r)),
    `Invalid validation config! Malformed rules for validation ${validationName}.`,
    rules,
    'Array of Arrays'
  )

  let result = []
  for (let r of rules) {
    let rr = r
    if (rr.length > 0 && typeof rr[0] === 'function') {
      rr = [r[0].name, ...r]
    }
    assertSpec(
      rr.length >= 2 && typeof rr[0] === 'string' && typeof rr[1] === 'function',
      `Invalid validation config! Malformed rule for validation ${validationName}.`,
      r,
      '[string, function, ...arguments] or [function, ...arguments]'
    )
    result.push(rr)
  }
  return result
}

function normalizeAllFields(fields) {
  assertSpec(
    isArray(fields) && fields.every((f) => typeof f === 'string'),
    'Invalid validation config! Malformed fields.',
    fields,
    'Array<string>'
  )
  return fields
}

function normalizeTypingDebounce(typingDebounce) {
  let result = typingDebounce
  if (result == null) {
    result = [2500, 1000]
  }
  if (typeof result === 'number') {
    result = [result, result]
  }
  assertSpec(
    isArray(result) && result.length === 2 && result.every((r) => typeof r === 'number'),
    'Invalid validation config! Malformed option typingDebounce.',
    typingDebounce,
    'Array<number> of length 2 or number or null'
  )
  return result
}

export function normalizeConfig(config) {
  let {
    validations,
    fields,
    onValidation = () => {},
    options: {
      asyncThrottle = 500, // throttle calculations of async validation rules
      typingDebounce,
    } = {}
  } = config

  assertSpec(
    typeof asyncThrottle === 'number',
    'Invalid validation config! Malformed option asyncThrottle.',
    asyncThrottle,
    'number'
  )
  typingDebounce = normalizeTypingDebounce(typingDebounce)

  let resultValidations = {}

  for (let name in validations) {
    let v = validations[name]
    if (isArray(v)) {
      // only rules were provided, expand the config to its full form
      v = {rules: v, fields: null}
    }

    resultValidations[name] = {
      rules: normalizeRules(name, v.rules),
      fields: normalizeFields(name, v.fields),
      debounce: asyncThrottle
    }
  }

  return {
    validations: resultValidations,
    fields: normalizeAllFields(fields),
    typingDebounce: {before: typingDebounce[0], after: typingDebounce[1]},
    onValidation,
  }
}
