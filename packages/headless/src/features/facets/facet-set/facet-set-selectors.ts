import {SearchPageState} from '../../../state/search-app-state';
import {FacetSection} from '../../../state/state-sections';

export const facetSelector = (state: SearchPageState, id: string) => {
  return state.search.response.facets.find(
    (response) => response.facetId === id
  );
};

export const facetRequestSelector = (state: FacetSection, id: string) => {
  return state.facetSet[id];
};
