import mongoose from 'mongoose';
import TreeModel from 'tree-model';
import { difference } from 'lodash';

import OperationModel from './operation';

const model = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
});

model.post('init', function postInit() {
  this._original = this.toObject({ version: false, depopulate: true });
});

model.pre('save', async function preValidate(next) {
  if (!this._original) {
    next();
    return;
  }

  const tree = new TreeModel();
  const rootNode = tree.parse(this.data);

  let oldCategoryList = tree.parse(this._original.data).all();
  let newCategoryList = rootNode.all();

  const blankCategoryId = rootNode.first(node => node.model.blank === true).model._id;

  oldCategoryList = oldCategoryList.map(category => category.model._id.toString());
  newCategoryList = newCategoryList.map(category => category.model._id.toString());

  const removedCategories = difference(oldCategoryList, newCategoryList);

  if (!removedCategories.length) {
    next();
    return;
  }

  try {
    await OperationModel.update({
      category: { $in: removedCategories },
      transfer: { $exists: false },
    }, { $set: { category: blankCategoryId } });
  } catch (e) {
    next(e);
    return;
  }

  next();
});

export default mongoose.model('Category', model);
