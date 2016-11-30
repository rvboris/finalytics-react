import { InfiniteLoader as Loader } from 'react-virtualized';
import createCallbackMemoizer from 'react-virtualized/dist/commonjs/utils/createCallbackMemoizer';

export default class InfiniteLoader extends Loader {
  clearCache() {
    this._loadMoreRowsMemoizer = createCallbackMemoizer();
  }
}
