import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorAlert from '../components/ErrorAlert';

describe('ErrorAlert', () => {
    it('should render error message', () => {
        render(<ErrorAlert message="Ocurrió un error" />);
        expect(screen.getByText('Ocurrió un error')).toBeInTheDocument();
    });

    it('should have alert-danger class', () => {
        render(<ErrorAlert message="Test" />);
        const alert = screen.getByRole('alert');
        expect(alert.className).toContain('alert-danger');
    });
});
