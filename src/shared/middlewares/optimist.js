import { isFSA } from 'flux-standard-action';
import { isBoolean } from 'lodash';
import uuid from 'uuid';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

const [RESOLVED_NAME, REJECTED_NAME] = ['_RESOLVED', '_REJECTED'];

const BEGIN = 'BEGIN';
const COMMIT = 'COMMIT';
const REVERT = 'REVERT';

function resolve(actionName) {
  return actionName + RESOLVED_NAME;
}

function reject(actionName) {
  return actionName + REJECTED_NAME;
}

export default ({ dispatch }) => (next) => (action) => {
  if (!isFSA(action) || !action.meta || !isPromise(action.meta.promise)) {
    return next(action);
  }

  const isOptimist = action.meta.optimist && isBoolean(action.meta.optimist);

  const transactionID = uuid.v4();

  const newAction = {
    ...action,
    meta: {
      ...action.meta,
    },
  };

  if (isOptimist) {
    newAction.meta.optimist = { type: BEGIN, id: transactionID };
  }

  if (Object.keys(newAction.meta).length === 1) {
    delete newAction.meta;
  } else {
    delete newAction.meta.promise;
  }

  const skipOptimist = action.meta.skipOptimist;

  if (!skipOptimist) {
    next(newAction);
  }

  const nextActionBase = {
    meta: {
      ...newAction.meta,
      payload: newAction.payload,
    },
  };

  if (!nextActionBase.meta.payload) {
    delete nextActionBase.meta.payload;
  }

  if (Object.keys(nextActionBase.meta).length === 0) {
    delete nextActionBase.meta;
  }

  return action.meta.promise.then((result) => {
    const actionToDispatch = {
      type: resolve(action.type),
      payload: result,
      ...nextActionBase,
    };

    if (isOptimist) {
      actionToDispatch.meta.optimist = { type: COMMIT, id: transactionID };
    }

    dispatch(actionToDispatch);

    return result;
  }).catch((error) => {
    const actionToDispatch = {
      type: reject(action.type),
      payload: error,
      ...nextActionBase,
    };

    if (isOptimist) {
      actionToDispatch.meta.optimist = { type: REVERT, id: transactionID };
    }

    dispatch(actionToDispatch);

    throw error;
  });
};
