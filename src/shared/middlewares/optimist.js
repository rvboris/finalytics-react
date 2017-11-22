import { isFSA } from 'flux-standard-action';
import { isBoolean } from 'lodash';
import uuid from 'uuid';

const BEGIN = 'BEGIN';
const COMMIT = 'COMMIT';
const REVERT = 'REVERT';

const isPromise = (val) => val && typeof val.then === 'function';
const resolveAction = (actionName) => `${actionName}_RESOLVED`;
const rejectAction = (actionName) => `${actionName}_REJECTED`;

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

  const { skipOptimist } = action.meta;

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
      type: resolveAction(action.type),
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
      type: rejectAction(action.type),
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
