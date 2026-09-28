// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import ThunderIDAPIError from '../../errors/ThunderIDAPIError';
import type {EmbeddedFlowComponent} from '../../models/embedded-flow';
import type {FetchSelectPage, SelectPage, SelectPageRequest} from '../../models/select-page';
import createResourceOptionsLoader, {ResourceOptionsLoader} from '../createResourceOptionsLoader';

const log = vi.hoisted(() => ({debug: vi.fn(), error: vi.fn()}));

vi.mock('../logger', () => ({
  createPackageComponentLogger: () => ({debug: log.debug, error: log.error, info: vi.fn(), warn: vi.fn()}),
}));

const component = {id: 'owner', type: 'USER_SELECT'} as EmbeddedFlowComponent;

const apiError = (statusCode: number, code = 'getUsers-ResponseError-001'): ThunderIDAPIError =>
  new ThunderIDAPIError('upstream said no', code, 'javascript', statusCode);

const createLoader = (fetchPage: FetchSelectPage, overrides: Record<string, unknown> = {}): ResourceOptionsLoader =>
  createResourceOptionsLoader({component, fetchPage, pageSize: 30, resource: 'users', ...overrides});

const page = (overrides: Partial<SelectPage> = {}): SelectPage => ({
  nextOffset: null,
  options: [{label: 'Alice', value: 'u1'}],
  ...overrides,
});

describe('createResourceOptionsLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    log.debug.mockClear();
    log.error.mockClear();
  });

  describe('paging', () => {
    it('asks for the first page at offset 0 with the page size, filter, component and signal', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page());
      const signal: AbortSignal = new AbortController().signal;

      await createLoader(fetchPage, {filter: 'status eq "active"', pageSize: 25})({signal});

      expect(fetchPage).toHaveBeenCalledWith({component, filter: 'status eq "active"', limit: 25, offset: 0, signal});
    });

    it('continues from the cursor and returns the offset of the next page', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page({nextOffset: 60}));

      const batch = await createLoader(fetchPage)({cursor: 30, signal: new AbortController().signal});

      expect(fetchPage.mock.calls[0][0].offset).toBe(30);
      expect(batch.nextCursor).toBe(60);
    });

    it('ends the data when the page has no next offset', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page({nextOffset: null}));

      const batch = await createLoader(fetchPage)({signal: new AbortController().signal});

      expect(batch.nextCursor).toBeNull();
    });

    it.each([0, 30, -5, 40.5])(
      'ends the data when the next offset (%s) does not move forward from 30',
      async (nextOffset) => {
        const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page({nextOffset}));

        const batch = await createLoader(fetchPage)({cursor: 30, signal: new AbortController().signal});

        expect(batch.nextCursor).toBeNull();
      },
    );
  });

  describe('live config', () => {
    it('reads the config on every call, so changed values apply to the next page', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue({
        items: [{code: 'x1', title: 'First'}],
        nextOffset: null,
      });
      const config = {
        component,
        fetchPage,
        mapping: {labelAttributes: ['title'], valueAttribute: 'code'},
        pageSize: 30,
        resource: 'users',
      };
      const load: ResourceOptionsLoader = createResourceOptionsLoader(config);

      const first = await load({signal: new AbortController().signal});
      config.mapping = {labelAttributes: ['code'], valueAttribute: 'title'};
      const second = await load({signal: new AbortController().signal});

      expect(first.options).toEqual([{label: 'First', value: 'x1'}]);
      expect(second.options).toEqual([{label: 'x1', value: 'First'}]);
    });
  });

  describe('options', () => {
    it('returns the options the page function made', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue(page());

      const batch = await createLoader(fetchPage)({signal: new AbortController().signal});

      expect(batch.options).toEqual([{label: 'Alice', value: 'u1'}]);
    });

    it('maps raw items with the mapping and defaults when no options are given', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue({
        items: [{id: 'u1', name: 'Alice'}],
        nextOffset: null,
      });

      const batch = await createLoader(fetchPage, {defaults: {labelAttributes: ['name']}})({
        signal: new AbortController().signal,
      });

      expect(batch.options).toEqual([{label: 'Alice', value: 'u1'}]);
    });

    it('prefers ready-made options over raw items', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockResolvedValue(page({items: [{id: 'raw'}], options: [{label: 'Ready', value: 'ready'}]}));

      const batch = await createLoader(fetchPage)({signal: new AbortController().signal});

      expect(batch.options).toEqual([{label: 'Ready', value: 'ready'}]);
    });

    it('returns no options for a page with neither', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockResolvedValue({nextOffset: null});

      const batch = await createLoader(fetchPage)({signal: new AbortController().signal});

      expect(batch.options).toEqual([]);
    });
  });

  describe('retry', () => {
    it('retries a server error once and returns the second result without logging', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValueOnce(apiError(503)).mockResolvedValue(page());

      const pending = createLoader(fetchPage)({signal: new AbortController().signal});
      await vi.advanceTimersByTimeAsync(500);

      await expect(pending).resolves.toMatchObject({options: [{value: 'u1'}]});
      expect(fetchPage).toHaveBeenCalledTimes(2);
      expect(log.error).not.toHaveBeenCalled();
    });

    it('retries a failure with no response once', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValueOnce(apiError(0)).mockResolvedValue(page());

      const pending = createLoader(fetchPage)({signal: new AbortController().signal});
      await vi.advanceTimersByTimeAsync(500);

      await expect(pending).resolves.toBeDefined();
      expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it.each([400, 401, 403, 404, 429])('does not retry a %i client error', async (status: number) => {
      const failure: ThunderIDAPIError = apiError(status);
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(failure);

      await expect(createLoader(fetchPage)({signal: new AbortController().signal})).rejects.toBe(failure);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('gives up after one retry and throws the last error', async () => {
      const last: ThunderIDAPIError = apiError(502);
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValueOnce(apiError(503)).mockRejectedValueOnce(last);

      const pending = createLoader(fetchPage)({signal: new AbortController().signal});
      await Promise.all([expect(pending).rejects.toBe(last), vi.advanceTimersByTimeAsync(500)]);

      expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it('does not retry an error that is not an API error', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(new TypeError('bad'));

      await expect(createLoader(fetchPage)({signal: new AbortController().signal})).rejects.toThrow('bad');
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('failure log', () => {
    it('logs one error line with the call, offset, limit, status, code and attempts', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(apiError(403, 'getUsers-ForbiddenError-001'));

      await expect(
        createLoader(fetchPage, {pageSize: 20})({cursor: 40, signal: new AbortController().signal}),
      ).rejects.toBeDefined();

      expect(log.error).toHaveBeenCalledTimes(1);
      const [message, details] = log.error.mock.calls[0] as [string, Record<string, unknown>];
      expect(message).toBe('Failed to load users.');
      expect(details).toMatchObject({
        attempts: 1,
        code: 'getUsers-ForbiddenError-001',
        limit: 20,
        offset: 40,
        status: 403,
      });
      expect(details).not.toHaveProperty('message');
      expect(typeof details['durationMs']).toBe('number');
    });

    it('counts both attempts of a retried failure', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(apiError(503));

      const pending = createLoader(fetchPage)({signal: new AbortController().signal});
      await Promise.all([expect(pending).rejects.toBeDefined(), vi.advanceTimersByTimeAsync(500)]);

      expect(log.error.mock.calls[0][1]).toMatchObject({attempts: 2, status: 503});
    });

    it('logs only the fields it names, never the request or its credentials', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockImplementation((request: SelectPageRequest) =>
          Promise.reject(Object.assign(apiError(500), {request, token: 'secret-token'})),
        );
      const pending = createLoader(fetchPage)({signal: new AbortController().signal});
      await Promise.all([expect(pending).rejects.toBeDefined(), vi.advanceTimersByTimeAsync(500)]);

      const details: Record<string, unknown> = log.error.mock.calls[0][1] as Record<string, unknown>;

      expect(Object.keys(details).sort()).toEqual(
        ['attempts', 'code', 'durationMs', 'limit', 'offset', 'status'].sort(),
      );
      expect(JSON.stringify(log.error.mock.calls)).not.toContain('secret-token');
    });

    it('logs the first failure of a code at error level and repeats at debug level', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(apiError(403, 'getUsers-ForbiddenError-001'));
      const load: ResourceOptionsLoader = createLoader(fetchPage);

      await expect(load({signal: new AbortController().signal})).rejects.toBeDefined();
      await expect(load({signal: new AbortController().signal})).rejects.toBeDefined();
      await expect(load({signal: new AbortController().signal})).rejects.toBeDefined();

      expect(log.error).toHaveBeenCalledTimes(1);
      expect(log.debug).toHaveBeenCalledTimes(2);
    });

    it('logs a different code at error level again', async () => {
      const fetchPage = vi
        .fn<FetchSelectPage>()
        .mockRejectedValueOnce(apiError(403, 'getUsers-ForbiddenError-001'))
        .mockRejectedValueOnce(apiError(404, 'getUsers-NotFoundError-001'));
      const load: ResourceOptionsLoader = createLoader(fetchPage);

      await expect(load({signal: new AbortController().signal})).rejects.toBeDefined();
      await expect(load({signal: new AbortController().signal})).rejects.toBeDefined();

      expect(log.error).toHaveBeenCalledTimes(2);
    });

    it('names the resource that failed', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue(apiError(404));

      await expect(
        createLoader(fetchPage, {resource: 'user types'})({signal: new AbortController().signal}),
      ).rejects.toBeDefined();

      expect(log.error.mock.calls[0][0]).toBe('Failed to load user types.');
    });

    it('logs an unknown error without a code or status', async () => {
      const fetchPage = vi.fn<FetchSelectPage>().mockRejectedValue('plain string');

      await expect(createLoader(fetchPage)({signal: new AbortController().signal})).rejects.toBe('plain string');

      expect(log.error.mock.calls[0][1]).toMatchObject({code: 'unknown', status: undefined});
    });

    it('does not log a load that was aborted', async () => {
      const controller: AbortController = new AbortController();
      const fetchPage = vi.fn<FetchSelectPage>().mockImplementation(() => {
        controller.abort();

        return Promise.reject(apiError(0));
      });

      await expect(createLoader(fetchPage)({signal: controller.signal})).rejects.toBeDefined();

      expect(log.error).not.toHaveBeenCalled();
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });
  });
});
