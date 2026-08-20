import { initializeApp } from "firebase-admin/app";

initializeApp();

export { onOrderCreated } from "./onOrderCreated";
export { checkOrderConfirmed } from "./checkOrderConfirmed";
export { onOrderStatusChanged } from "./onOrderStatusChanged";
