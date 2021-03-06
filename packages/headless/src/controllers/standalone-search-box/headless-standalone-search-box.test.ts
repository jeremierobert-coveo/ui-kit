import {
  buildStandaloneSearchBox,
  StandaloneSearchBox,
  StandaloneSearchBoxOptions,
} from './headless-standalone-search-box';
import {checkForRedirection} from '../../features/redirection/redirection-actions';
import {createMockState} from '../../test/mock-state';
import {updateQuery} from '../../features/query/query-actions';
import {buildMockQuerySuggest} from '../../test/mock-query-suggest';
import {buildMockSearchAppEngine, MockEngine} from '../../test/mock-engine';
import {SearchAppState} from '../../state/search-app-state';
import {registerQuerySetQuery} from '../../features/query-set/query-set-actions';
import {selectQuerySuggestion} from '../../features/query-suggest/query-suggest-actions';

describe('headless standalone searchBox', () => {
  const id = 'search-box-123';
  let state: SearchAppState;

  let engine: MockEngine<SearchAppState>;
  let searchBox: StandaloneSearchBox;
  let options: StandaloneSearchBoxOptions;

  beforeEach(() => {
    options = {
      id,
      redirectionUrl: 'https://www.coveo.com/en/search',
    };

    initState();
    initController();
  });

  function initState() {
    state = createMockState();
    state.redirection.redirectTo = 'coveo.com';
    state.querySet[id] = 'query';
    state.querySuggest[id] = buildMockQuerySuggest({id, q: 'some value'});
  }

  function initController() {
    engine = buildMockSearchAppEngine({state});
    searchBox = buildStandaloneSearchBox(engine, {options});
  }

  it('when no id is passed, it creates an id prefixed with standalone_search_box', () => {
    options = {redirectionUrl: 'https://www.coveo.com/en/search'};
    initController();

    const action = engine.actions.find(
      (a) => a.type === registerQuerySetQuery.type
    );

    const payload = expect.objectContaining({
      id: expect.stringContaining('standalone_search_box'),
    });

    expect(action).toEqual(expect.objectContaining({payload}));
  });

  it('when configuring an invalid option, it throws an error', () => {
    options.numberOfSuggestions = ('1' as unknown) as number;
    expect(() => initController()).toThrow(
      'Check the options of buildStandaloneSearchBox'
    );
  });

  it('should return the right state', () => {
    expect(searchBox.state).toEqual({
      value: state.querySet[id],
      suggestions: state.querySuggest[id]!.completions.map((completion) => ({
        value: completion.expression,
      })),
      redirectTo: state.redirection.redirectTo,
      isLoading: false,
    });
  });

  describe('#selectSuggestion', () => {
    it('updates the query', () => {
      const expression = 'a';
      searchBox.selectSuggestion(expression);

      expect(engine.actions).toContainEqual(
        selectQuerySuggestion({id, expression})
      );
    });

    it('calls #submit', () => {
      jest.spyOn(searchBox, 'submit');
      searchBox.selectSuggestion('a');

      expect(searchBox.submit).toHaveBeenCalledTimes(1);
    });
  });

  describe('when calling submit', () => {
    it('dispatches updateQuery with the correct parameters', () => {
      const expectedQuery = state.querySet[id];
      searchBox.submit();

      expect(engine.actions).toContainEqual(
        updateQuery({q: expectedQuery, enableQuerySyntax: false})
      );
    });

    it('should dispatch a checkForRedirection action', () => {
      searchBox.submit();

      const action = engine.actions.find(
        (a) => a.type === checkForRedirection.pending.type
      );
      expect(action).toBeTruthy();
    });
  });
});
