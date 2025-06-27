import { ApiClient } from '@/lib/api-client';

// Mock fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
    jest.clearAllMocks();
  });

  describe('handleResponse', () => {
    it('should handle pre-wrapped ApiResponse format', async () => {
      const mockData = { data: [{ id: '1', name: 'Test' }] };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockData,
      });

      const response = await apiClient.get('/test');
      
      expect(response).toEqual(mockData);
      expect(response.data).toEqual([{ id: '1', name: 'Test' }]);
    });

    it('should wrap non-ApiResponse format', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockData,
      });

      const response = await apiClient.get('/test');
      
      expect(response).toEqual({ data: mockData });
      expect(response.data).toEqual(mockData);
    });

    it('should handle error responses', async () => {
      const mockError = { error: 'Something went wrong' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockError,
      });

      const response = await apiClient.get('/test');
      
      expect(response).toEqual(mockError);
      expect(response.error).toEqual('Something went wrong');
    });

    it('should handle mixed ApiResponse with both data and error', async () => {
      const mockResponse = { 
        data: { id: '1' }, 
        error: 'Warning message' 
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockResponse,
      });

      const response = await apiClient.get('/test');
      
      expect(response).toEqual(mockResponse);
      expect(response.data).toEqual({ id: '1' });
      expect(response.error).toEqual('Warning message');
    });
  });
});