
import vehicleTelemetryReducer from './vehicleTelemetryReducer';

const rootReducer = combineReducers({
  vehicle: vehicleTelemetryReducer,
});

export default rootReducer;
