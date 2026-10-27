// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import ThunderIDAPIError from '../ThunderIDAPIError';
import ThunderIDError from '../ThunderIDError';

describe('ThunderIDAPIError', (): void => {
  it('should create an API error with status code and text', (): void => {
    const message = 'Not Found Error';
    const code = 'API_NOT_FOUND';
    const origin = 'react';
    const statusCode = 404;
    const statusText = 'Not Found';
    const error: ThunderIDAPIError = new ThunderIDAPIError(message, code, origin, statusCode, statusText);

    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
    expect(error.statusCode).toBe(statusCode);
    expect(error.statusText).toBe(statusText);
    expect(error.toString()).toBe(
      '[ThunderIDAPIError] (code="API_NOT_FOUND") (HTTP 404 - Not Found)\nMessage: Not Found Error',
    );
  });

  it('should create an API error without status code and text', (): void => {
    const message = 'Unknown API Error';
    const code = 'API_ERROR';
    const origin = 'javascript';
    const error: ThunderIDAPIError = new ThunderIDAPIError(message, code, origin);

    expect(error.message).toBe(message);
    expect(error.statusCode).toBeUndefined();
    expect(error.statusText).toBeUndefined();
    expect(error.toString()).toBe('[ThunderIDAPIError] (code="API_ERROR")\nMessage: Unknown API Error');
  });

  it('should have correct name and be instance of Error, ThunderIDError, and ThunderIDAPIError', (): void => {
    const message = 'Test Error';
    const code = 'TEST_ERROR';
    const origin = 'react';
    const error: ThunderIDAPIError = new ThunderIDAPIError(message, code, origin);

    expect(error.name).toBe('ThunderIDAPIError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ThunderIDAPIError);
    expect(error).toBeInstanceOf(ThunderIDError);
  });

  it('should format toString with status when available', (): void => {
    const message = 'Bad Request';
    const code = 'API_BAD_REQUEST';
    const origin = 'react';
    const statusCode = 400;
    const statusText = 'Bad Request';
    const error: ThunderIDAPIError = new ThunderIDAPIError(message, code, origin, statusCode, statusText);

    const expected = '[ThunderIDAPIError] (code="API_BAD_REQUEST") (HTTP 400 - Bad Request)\nMessage: Bad Request';

    expect(error.toString()).toBe(expected);
  });

  it('should format toString without status when not available', (): void => {
    const message = 'Test Error';
    const code = 'TEST_ERROR';
    const origin = 'react';
    const error: ThunderIDAPIError = new ThunderIDAPIError(message, code, origin);

    const expected = '[ThunderIDAPIError] (code="TEST_ERROR")\nMessage: Test Error';

    expect(error.toString()).toBe(expected);
  });

  it('should default to the agnostic SDK if no origin is provided', (): void => {
    const message = 'Test message';
    const code = 'TEST_ERROR';
    const error: ThunderIDAPIError = new ThunderIDAPIError(message, code, '');

    expect(error.origin).toBe('@thunderid/javascript');
  });

  it('should have a stack trace that includes the error message', () => {
    const err: ThunderIDAPIError = new ThunderIDAPIError('Trace me', 'TRACE', 'js');
    expect(err.stack).toBeDefined();
    expect(String(err.stack)).toContain('Trace me');
  });

  it('toString includes status when statusCode is present but statusText is missing', () => {
    const err: ThunderIDAPIError = new ThunderIDAPIError('Oops', 'CODE', 'js', 500);
    expect(err.toString()).toBe('[ThunderIDAPIError] (code="CODE") (HTTP 500 - undefined)\nMessage: Oops');
  });
});

describe('ThunderIDAPIError — structured response body parsing', (): void => {
  it('should extract description.defaultValue from a structured error body', (): void => {
    const errorText: string = JSON.stringify({
      code: 'SSE-5000',
      description: {defaultValue: 'An unexpected error occurred', key: 'error.desc'},
    });
    const error: ThunderIDAPIError = new ThunderIDAPIError(
      errorText,
      'CODE',
      'javascript',
      500,
      'Internal Server Error',
    );
    expect(error.message).toBe('An unexpected error occurred');
    expect(error.statusCode).toBe(500);
    expect(error.statusText).toBe('Internal Server Error');
  });

  it('should fall back to message.defaultValue when description is absent', (): void => {
    const errorText: string = JSON.stringify({
      code: 'SSE-5000',
      message: {defaultValue: 'Internal server error', key: 'error.msg'},
    });
    const error: ThunderIDAPIError = new ThunderIDAPIError(errorText, 'CODE', 'javascript', 500);
    expect(error.message).toBe('Internal server error');
  });

  it('should use raw text when response is not structured JSON', (): void => {
    const error: ThunderIDAPIError = new ThunderIDAPIError('Unauthorized', 'CODE', 'javascript', 401, 'Unauthorized');
    expect(error.message).toBe('Unauthorized');
  });

  it('should use raw text when JSON does not match the known error shape', (): void => {
    const errorText: string = JSON.stringify({error: 'something_went_wrong'});
    const error: ThunderIDAPIError = new ThunderIDAPIError(errorText, 'CODE', 'javascript', 400);
    expect(error.message).toBe(errorText);
  });

  it('should prepend prefix to a structured description.defaultValue', (): void => {
    const errorText: string = JSON.stringify({
      description: {defaultValue: 'Invalid credentials provided'},
    });
    const error: ThunderIDAPIError = new ThunderIDAPIError(
      errorText,
      'CODE',
      'javascript',
      401,
      'Unauthorized',
      'Authorization request failed',
    );
    expect(error.message).toBe('Authorization request failed: Invalid credentials provided');
  });

  it('should prepend prefix to raw text when response is not structured JSON', (): void => {
    const error: ThunderIDAPIError = new ThunderIDAPIError(
      'Unauthorized',
      'CODE',
      'javascript',
      401,
      'Unauthorized',
      'Authorization request failed',
    );
    expect(error.message).toBe('Authorization request failed: Unauthorized');
  });

  it('should not prepend prefix when prefix is not provided', (): void => {
    const errorText: string = JSON.stringify({
      description: {defaultValue: 'Invalid credentials provided'},
    });
    const error: ThunderIDAPIError = new ThunderIDAPIError(errorText, 'CODE', 'javascript', 401);
    expect(error.message).toBe('Invalid credentials provided');
  });

  it('should never surface a raw expired-flow response body to consumers', (): void => {
    const errorText: string = JSON.stringify({
      code: 'FES-1004',
      description: {
        defaultValue: 'Invalid flow execution ID provided in the request',
        key: 'error.flowexecservice.invalid_execution_id_description',
      },
      message: {defaultValue: 'Invalid request', key: 'error.flowexecservice.invalid_execution_id'},
    });
    const error: ThunderIDAPIError = new ThunderIDAPIError(errorText, 'FES-1004', 'react', 400, 'Bad Request');

    expect(error.message).not.toContain('FES-1004');
    expect(error.message).not.toContain('error.flowexecservice');
    expect(error.code).toBe('FES-1004');
  });
});

describe('ThunderIDAPIError server error', () => {
  it("keeps the server's error envelope, with its code and params", () => {
    const body: string = JSON.stringify({
      code: 'USR-1027',
      description: {defaultValue: 'Agents depend on it', params: {dependencies: 'agents'}},
      message: {defaultValue: 'User cannot be deleted'},
    });

    const error: ThunderIDAPIError = new ThunderIDAPIError(body, 'deleteUser-ResponseError-001', 'javascript', 409);

    expect(error.message).toBe('User cannot be deleted');
    expect(error.serverError).toEqual({
      code: 'USR-1027',
      description: {defaultValue: 'Agents depend on it', params: {dependencies: 'agents'}},
      message: {defaultValue: 'User cannot be deleted'},
    });
  });

  it('has no server error when the body is not an error envelope', () => {
    expect(
      new ThunderIDAPIError('Bad gateway', 'getUser-ResponseError-001', 'javascript', 502).serverError,
    ).toBeUndefined();
    expect(
      new ThunderIDAPIError('{"foo":1}', 'getUser-ResponseError-001', 'javascript', 500).serverError,
    ).toBeUndefined();
  });
});
