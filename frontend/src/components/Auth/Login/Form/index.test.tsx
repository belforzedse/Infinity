import { render, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './index';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/hooks/useCheckPhoneNumber', () => ({
  useCheckPhoneNumber: jest.fn(),
}));

import { useCheckPhoneNumber } from '@/hooks/useCheckPhoneNumber';

const mockPush = push;
const mockUseCheck = useCheckPhoneNumber as jest.Mock;

describe('LoginForm component', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseCheck.mockReset();
  });

  it('redirects to /auth when phone number is missing', async () => {
    mockUseCheck.mockReturnValue({ phoneNumber: '' });
    render(<LoginForm onSubmit={jest.fn()} />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/auth'));
  });

  it('calls onSubmit with form data', async () => {
    mockUseCheck.mockReturnValue({ phoneNumber: '09123456789' });
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { container } = render(<LoginForm onSubmit={onSubmit} />);
    const form = container.querySelector('form');
    if (!form) throw new Error('form not found');
    fireEvent.submit(form);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        phoneNumber: '09123456789',
        password: '',
        rememberMe: false,
      }),
    );
  });
});
