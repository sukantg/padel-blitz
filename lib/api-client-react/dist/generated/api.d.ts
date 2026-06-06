import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ApiError, CoachAnalysis, CoachInput, HealthStatus, NftImage, NftInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGenerateNftUrl: () => string;
/**
 * Builds a tier-aware prompt and returns a generated portrait image as a data URL.
 * @summary Generate an AI superhero player card image
 */
export declare const generateNft: (nftInput: NftInput, options?: RequestInit) => Promise<NftImage>;
export declare const getGenerateNftMutationOptions: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateNft>>, TError, {
        data: BodyType<NftInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generateNft>>, TError, {
    data: BodyType<NftInput>;
}, TContext>;
export type GenerateNftMutationResult = NonNullable<Awaited<ReturnType<typeof generateNft>>>;
export type GenerateNftMutationBody = BodyType<NftInput>;
export type GenerateNftMutationError = ErrorType<ApiError>;
/**
* @summary Generate an AI superhero player card image
*/
export declare const useGenerateNft: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateNft>>, TError, {
        data: BodyType<NftInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generateNft>>, TError, {
    data: BodyType<NftInput>;
}, TContext>;
export declare const getGetCoachAnalysisUrl: () => string;
/**
 * Returns a structured coaching breakdown based on the player's described session.
 * @summary Get an AI padel coaching analysis
 */
export declare const getCoachAnalysis: (coachInput: CoachInput, options?: RequestInit) => Promise<CoachAnalysis>;
export declare const getGetCoachAnalysisMutationOptions: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof getCoachAnalysis>>, TError, {
        data: BodyType<CoachInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof getCoachAnalysis>>, TError, {
    data: BodyType<CoachInput>;
}, TContext>;
export type GetCoachAnalysisMutationResult = NonNullable<Awaited<ReturnType<typeof getCoachAnalysis>>>;
export type GetCoachAnalysisMutationBody = BodyType<CoachInput>;
export type GetCoachAnalysisMutationError = ErrorType<ApiError>;
/**
* @summary Get an AI padel coaching analysis
*/
export declare const useGetCoachAnalysis: <TError = ErrorType<ApiError>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof getCoachAnalysis>>, TError, {
        data: BodyType<CoachInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof getCoachAnalysis>>, TError, {
    data: BodyType<CoachInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map