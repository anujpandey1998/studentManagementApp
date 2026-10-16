import axios from 'axios';
import { ApiError, normalizeApiError } from '../src/services/api/apiError';

test('normalizes Supabase REST errors without hiding status or code', () => {
  const error = new axios.AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
      data: {
        message: 'Row-level security denied this request.',
        code: '42501',
      },
    },
  );

  expect(normalizeApiError(error)).toEqual(
    new ApiError('Row-level security denied this request.', 403, '42501'),
  );
});
