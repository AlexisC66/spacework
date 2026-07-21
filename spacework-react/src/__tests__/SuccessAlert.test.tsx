import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuccessAlert from '../components/SuccessAlert';

describe('SuccessAlert', () => {
    it('should render success message', () => {
        render(<SuccessAlert message="Operación exitosa" />);
        expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
    });

    it('should have alert-success class', () => {
        render(<SuccessAlert message="Test" />);
        const alert = screen.getByRole('alert');
        expect(alert.className).toContain('alert-success');
    });

    it('should render with different messages', () => {
        const { rerender } = render(<SuccessAlert message="Mensaje 1" />);
        expect(screen.getByText('Mensaje 1')).toBeInTheDocument();

        rerender(<SuccessAlert message="Mensaje 2" />);
        expect(screen.getByText('Mensaje 2')).toBeInTheDocument();
    });
});
