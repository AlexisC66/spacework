import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle GET requests', async () => {
        const mockData = [{ id: 1, nombre: 'Sala A' }];
        mockedAxios.get.mockResolvedValue({ data: mockData });

        const response = await axios.get('/api/espacios');
        expect(response.data).toEqual(mockData);
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/espacios');
    });

    it('should handle POST requests', async () => {
        const mockData = { id: 1, nombre: 'Juan' };
        const payload = { nombre: 'Juan', email: 'juan@test.com' };
        mockedAxios.post.mockResolvedValue({ data: mockData });

        const response = await axios.post('/api/auth/registro', payload);
        expect(response.data).toEqual(mockData);
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/registro', payload);
    });

    it('should handle HTTP errors', async () => {
        const error = { response: { status: 401, data: { error: 'No autorizado' } } };
        mockedAxios.get.mockRejectedValue(error);

        await expect(axios.get('/api/auth/validate')).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network Error'));

        await expect(axios.get('/api/espacios')).rejects.toThrow('Network Error');
    });
});
