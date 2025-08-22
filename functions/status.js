export const onRequest = ({ env }) =>
  new Response(env.KRN_DB ? "db:ok" : "db:missing");
