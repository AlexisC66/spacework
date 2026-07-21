import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../components/Loading';

describe('Loading', () => {
    it('should render loading text', () => {
        render(<Loading />);
        const loadingElements = screen.getAllByText(/cargando/i);
        expect(loadingElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render default message when no message prop', () => {
        render(<Loading />);
        const elements = screen.getAllByText('Cargando...');
        expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have spinner element', () => {
        render(<Loading />);
        const spinner = document.querySelector('.spinner-border');
        expect(spinner).toBeInTheDocument();
    });
});
