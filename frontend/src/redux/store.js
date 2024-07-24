import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/features/auth/authSlice";
import vehicleTelemetryReducer from "./features/product/vehicleTelemetryReducer";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicle: vehicleTelemetryReducer
  },
  middleware: (getDefaultMiddleware) => 
  getDefaultMiddleware({
    immutableCheck: {
      warnAfter: 100 // ms
    },
    serializableCheck: {
      warnAfter: 100 // ms
    }
  }),
});