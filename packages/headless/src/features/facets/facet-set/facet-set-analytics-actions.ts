import {FacetValue, FacetSortCriterion} from './facet-set-interfaces';
import {createAsyncThunk} from '@reduxjs/toolkit';
import {
  searchPageState,
  makeSearchActionType,
} from '../../analytics/analytics-actions';
import {configureAnalytics} from '../../../api/analytics/analytics';
import {SearchPageState} from '../../../state';

export type FacetUpdateSortMetadata = {
  facetId: string;
  criterion: FacetSortCriterion;
};

export type FacetSelectionChangeMetadata = {
  facetId: string;
  selection: FacetValue;
};

/**
 * Log a facet sort change.
 */
export const logFacetUpdateSort = createAsyncThunk(
  'analytics/facet/sortChange',
  async (payload: FacetUpdateSortMetadata, {getState}) => {
    const {facetId, criterion} = payload;
    const state = searchPageState(getState);

    const base = buildFacetBaseMetadata(facetId, state);
    const metadata = {...base, criteria: criterion};

    await configureAnalytics(state).logFacetUpdateSort(metadata);
    return makeSearchActionType();
  }
);

/**
 * Log a facet clear all event.
 * @param facetId The unique identifier for the facet.
 */
export const logFacetClearAll = createAsyncThunk(
  'analytics/facet/reset',
  async (facetId: string, {getState}) => {
    const state = searchPageState(getState);
    const metadata = buildFacetBaseMetadata(facetId, state);

    await configureAnalytics(state).logFacetClearAll(metadata);
    return makeSearchActionType();
  }
);

/**
 * Log the selected facet value.
 */
export const logFacetSelect = createAsyncThunk(
  'analytics/facet/select',
  async (payload: FacetSelectionChangeMetadata, {getState}) => {
    const state = searchPageState(getState);
    const metadata = buildFacetSelectionChangeMetadata(payload, state);

    await configureAnalytics(state).logFacetSelect(metadata);
    return makeSearchActionType();
  }
);

/**
 * Log the deselected facet value.
 */
export const logFacetDeselect = createAsyncThunk(
  'analytics/facet/deselect',
  async (payload: FacetSelectionChangeMetadata, {getState}) => {
    const state = searchPageState(getState);
    const metadata = buildFacetSelectionChangeMetadata(payload, state);

    await configureAnalytics(state).logFacetDeselect(metadata);
    return makeSearchActionType();
  }
);

function buildFacetSelectionChangeMetadata(
  payload: FacetSelectionChangeMetadata,
  state: SearchPageState
) {
  const {facetId, selection} = payload;
  const facetValue = selection.value;
  const base = buildFacetBaseMetadata(facetId, state);

  return {...base, facetValue};
}

function buildFacetBaseMetadata(facetId: string, state: SearchPageState) {
  const facetField = state.facetSet[facetId].field;
  const facetTitle = `${facetField}_${facetId}`;

  return {facetId, facetField, facetTitle};
}