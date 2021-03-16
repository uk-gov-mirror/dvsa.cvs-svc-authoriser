import {isSafe, toHttpVerb} from "../../../src/services/http-verbs";

describe('toHttpVerb()', () => {
  it('should return correct httpVerb from string', () => {
    expect(toHttpVerb('*')).toEqual('*');
    expect(toHttpVerb('HEAD')).toEqual('HEAD');
    expect(toHttpVerb('OPTIONS')).toEqual('OPTIONS');
    expect(toHttpVerb('GET')).toEqual('GET');
    expect(toHttpVerb('POST')).toEqual('POST');
    expect(toHttpVerb('PUT')).toEqual('PUT');
    expect(toHttpVerb('PATCH')).toEqual('PATCH');
    expect(toHttpVerb('DELETE')).toEqual('DELETE');
    expect(toHttpVerb('TRACE')).toEqual('TRACE');
  });
});

describe('isSafe()', () => {
  it('should return safe only for GET and HEAD', () => {
    expect(isSafe('HEAD')).toBeTruthy();
    expect(isSafe('GET')).toBeTruthy();
    expect(isSafe('*')).toBeFalsy();
    expect(isSafe('OPTIONS')).toBeFalsy();
    expect(isSafe('POST')).toBeFalsy();
    expect(isSafe('PUT')).toBeFalsy();
    expect(isSafe('PATCH')).toBeFalsy();
    expect(isSafe('DELETE')).toBeFalsy();
    expect(isSafe('TRACE')).toBeFalsy();
  });
});
