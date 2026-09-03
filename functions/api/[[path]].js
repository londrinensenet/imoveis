import worker from "../../src/admin/worker.js";

export function onRequest(context) {
  return worker.fetch(context.request, context.env);
}
