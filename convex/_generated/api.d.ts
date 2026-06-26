/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as challenges from "../challenges.js";
import type * as clients from "../clients.js";
import type * as devHelpers from "../devHelpers.js";
import type * as gymInvitations from "../gymInvitations.js";
import type * as gymTrainers from "../gymTrainers.js";
import type * as gyms from "../gyms.js";
import type * as joinRequests from "../joinRequests.js";
import type * as measurements from "../measurements.js";
import type * as nutritionPlans from "../nutritionPlans.js";
import type * as personalTrainers from "../personalTrainers.js";
import type * as products from "../products.js";
import type * as programs from "../programs.js";
import type * as seed from "../seed.js";
import type * as storage from "../storage.js";
import type * as subscriptionLimits from "../subscriptionLimits.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  challenges: typeof challenges;
  clients: typeof clients;
  devHelpers: typeof devHelpers;
  gymInvitations: typeof gymInvitations;
  gymTrainers: typeof gymTrainers;
  gyms: typeof gyms;
  joinRequests: typeof joinRequests;
  measurements: typeof measurements;
  nutritionPlans: typeof nutritionPlans;
  personalTrainers: typeof personalTrainers;
  products: typeof products;
  programs: typeof programs;
  seed: typeof seed;
  storage: typeof storage;
  subscriptionLimits: typeof subscriptionLimits;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
