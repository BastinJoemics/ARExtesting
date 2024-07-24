// src/redux/selectors.js
import { createSelector } from 'reselect';

const getTelemetryDataState = (state) => state.vehicle.telemetryData;

export const selectUser = (state) => state.auth.user;


export const selectTelemetryData = createSelector(
  [getTelemetryDataState],
  (telemetryData) => Object.values(telemetryData)
);
