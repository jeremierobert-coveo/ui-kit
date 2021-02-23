import {Engine} from '../../app/headless-engine';
import {buildController, Controller} from '../controller/headless-controller';
import {back, forward} from '../../features/history/history-actions';
import {executeSearch} from '../../features/search/search-actions';
import {
  logNavigateBackward,
  logNavigateForward,
} from '../../features/history/history-analytics-actions';
import {HistoryState as HistoryStateFeature} from '../../features/history/history-state';
import {StateWithHistory} from '../../app/undoable';

/**
 * The `History` controller is in charge of allowing navigating back and forward in the search interface history.
 */
export interface History extends Controller {
  /**
   * The state of the `History` controller.
   */
  state: HistoryState;

  /**
   * Move backward in the interface history.
   */
  back(): Promise<void>;

  /**
   * Move forward in the interface history.
   */
  forward(): Promise<void>;
}

/**
 * The state relevant to the `History` controller.
 * */
export type HistoryState = StateWithHistory<HistoryStateFeature>;

/**
 * Creates a `History` controller instance.
 *
 * @param engine - The headless engine.
 */
export function buildHistory(engine: Engine): History {
  const controller = buildController(engine);
  const {dispatch} = engine;

  return {
    ...controller,
    get state() {
      return engine.state.history;
    },

    async back() {
      if (!this.state.past.length || !this.state.present) {
        return;
      }
      await dispatch(back());
      dispatch(executeSearch(logNavigateBackward()));
    },

    async forward() {
      if (!this.state.future.length || !this.state.present) {
        return;
      }
      await dispatch(forward());
      dispatch(executeSearch(logNavigateForward()));
    },
  };
}
