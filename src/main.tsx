import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter, parseSearchWith, stringifySearchWith } from "@tanstack/react-router";
import qs from "query-string";
import "./index.css";

import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  // https://tanstack.com/router/latest/docs/framework/react/guide/custom-search-param-serialization#using-the-query-string-library
  stringifySearch: stringifySearchWith((value) => {
    return qs.stringify(value, {});
  }),
  parseSearch: parseSearchWith((value) => {
    const parsed = qs.parse(value, {});
    const keys = Object.keys(parsed);

    // parseSearchWith doesn't know if the value is a 'string' or 'prop=string'
    if (keys.length === 1 && parsed[keys[0]] === null) {
      return value;
    }
    return parsed;
  }),
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
