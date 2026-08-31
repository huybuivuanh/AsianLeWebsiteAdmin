import { initializeApp } from "firebase-admin/app";

initializeApp();

export { nagUnconfirmedOrders } from "./nagUnconfirmedOrders";
export { onOrderStatusChanged } from "./onOrderStatusChanged";
