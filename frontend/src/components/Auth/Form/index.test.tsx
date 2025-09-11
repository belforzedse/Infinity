import { render, fireEvent } from '@testing-library/react';
import AuthForm from './index';

const mockCheck = jest.fn();
jest.mock('@/hooks/useCheckPhoneNumber', () => ({
  useCheckPhoneNumber: () => ({
    isLoading: false,
    error: null,
    checkPhoneNumber: mockCheck,
  }),
}));

describe('AuthForm component', () => {
  it('submits phone number for checking', () => {
    const { getByPlaceholderText, container } = render(<AuthForm />);
    const input = getByPlaceholderText('09122032114');
    fireEvent.change(input, { target: { value: '09123456789' } });
    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');
    fireEvent.submit(form);
    expect(mockCheck).toHaveBeenCalledWith('09123456789');
  });
});
