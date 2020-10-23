import {createReducer} from '@reduxjs/toolkit';
import {getRecommendations, setRecommendation} from './recommendation-actions';
import {getRecommendationInitialState} from './recommendation-state';

export const recommendationReducer = createReducer(
  getRecommendationInitialState(),

  (builder) => {
    builder
      .addCase(setRecommendation, (state, action) => {
        state.id = action.payload.id;
      })
      .addCase(getRecommendations.rejected, (state, action) => {
        state.error = action.payload ? action.payload : null;
        state.isLoading = false;
      })
      .addCase(getRecommendations.fulfilled, (state, action) => {
        state.error = null;
        state.recommendations = action.payload.recommendations;
        (state.duration = action.payload.duration), (state.isLoading = false);
      })
      .addCase(getRecommendations.pending, (state) => {
        state.isLoading = true;
      });
  }
);
