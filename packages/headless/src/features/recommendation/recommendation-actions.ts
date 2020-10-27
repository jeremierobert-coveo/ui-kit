import {createAction, createAsyncThunk} from '@reduxjs/toolkit';
import {configureAnalytics, historyStore} from '../../api/analytics/analytics';
import {RecommendationRequest} from '../../api/search/recommendation/recommendation-request';
import {
  AsyncThunkSearchOptions,
  isErrorResponse,
} from '../../api/search/search-api-client';
import {Result} from '../../api/search/search/result';
import {
  AdvancedSearchQueriesSection,
  ConfigurationSection,
  ContextSection,
  FieldsSection,
  PipelineSection,
  RecommendationSection,
  SearchHubSection,
} from '../../state/state-sections';
import {
  makeSearchActionType,
  SearchAction,
} from '../analytics/analytics-actions';
import {StateNeededByAnalyticsProvider} from '../../api/analytics/analytics';
import {validatePayloadSchema} from '../../utils/validate-payload';
import {StringValue} from '@coveo/bueno';

export type StateNeededByGetRecommendations = ConfigurationSection &
  RecommendationSection &
  Partial<
    SearchHubSection &
      PipelineSection &
      AdvancedSearchQueriesSection &
      ContextSection &
      FieldsSection
  >;

export interface GetRecommendationsThunkReturn {
  recommendations: Result[];
  analyticsAction: SearchAction;
  duration: number;
}

/**
 * Set recommendation identifier.
 */
export const setRecommendation = createAction(
  'recommendation/set',
  (payload: {id: string}) =>
    validatePayloadSchema(payload, {
      id: new StringValue({required: true, emptyAllowed: false}),
    })
);

/**
 * Logs a search event with an `actionCause` value of `recommendationInterfaceLoad`.
 */
export const logRecommendation = createAsyncThunk(
  'analytics/recommnendation/load',
  async (_, {getState}) => {
    const state = getState() as StateNeededByAnalyticsProvider;
    await configureAnalytics(state).logRecommendationInterfaceLoad();
    return makeSearchActionType();
  }
);

/**
 * Get recommendations.
 */
export const getRecommendations = createAsyncThunk<
  GetRecommendationsThunkReturn,
  void,
  AsyncThunkSearchOptions<StateNeededByGetRecommendations>
>(
  'recommendation/get',
  async (_, {getState, rejectWithValue, extra: {searchAPIClient}}) => {
    const state = getState();
    const startedAt = new Date().getTime();
    const fetched = await searchAPIClient.recommendations(
      buildRecommendationRequest(state)
    );
    const duration = new Date().getTime() - startedAt;
    if (isErrorResponse(fetched)) {
      return rejectWithValue(fetched.error);
    }
    return {
      recommendations: fetched.success.results,
      analyticsAction: logRecommendation(),
      duration,
    };
  }
);

export const buildRecommendationRequest = (
  s: StateNeededByGetRecommendations
): RecommendationRequest => ({
  accessToken: s.configuration.accessToken,
  organizationId: s.configuration.organizationId,
  url: s.configuration.search.apiBaseUrl,
  recommendation: s.recommendation.id,
  actionsHistory: s.configuration.analytics.enabled
    ? historyStore.getHistory()
    : [],
  ...(s.advancedSearchQueries && {
    aq: s.advancedSearchQueries.aq,
    cq: s.advancedSearchQueries.cq,
  }),
  ...(s.pipeline && {
    pipeline: s.pipeline,
  }),
  ...(s.searchHub && {
    searchHub: s.searchHub,
  }),
  ...(s.context && {
    context: s.context.contextValues,
  }),
  ...(s.fields && {
    fieldsToInclude: s.fields.fieldsToInclude,
  }),
});
