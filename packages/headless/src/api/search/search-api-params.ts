import {SearchPageState} from '../../state/search-app-state';
import {HttpMethods, HTTPContentTypes} from '../platform-client';

/**
 * The unique identifier of the target Coveo Cloud organization.
 */
export const getOrganizationIdQueryParam = (state: SearchPageState) =>
  `organizationId=${state.configuration.organizationId}`;

export const getQParam = (state: SearchPageState) => ({
  /**
   * The basic query expression filter applied to the state.
   */
  q: state.query.q,
});

const getAccessToken = (state: SearchPageState) =>
  state.configuration.accessToken;
const getSearchApiBaseUrl = (state: SearchPageState) =>
  state.configuration.search.apiBaseUrl;

export const baseSearchParams = (
  state: SearchPageState,
  method: HttpMethods,
  contentType: HTTPContentTypes,
  path: string
) => ({
  accessToken: getAccessToken(state),
  method,
  contentType,
  url: `${getSearchApiBaseUrl(state)}${path}?${getOrganizationIdQueryParam(
    state
  )}`,
});
