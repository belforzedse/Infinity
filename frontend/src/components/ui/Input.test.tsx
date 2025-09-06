import { render, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input component', () => {
  it('renders and handles change events', () => {
    const handleChange = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="name" onChange={handleChange} />
    );
    const input = getByPlaceholderText('name');
    fireEvent.change(input, { target: { value: 'John' } });
    expect(handleChange).toHaveBeenCalled();
  });
});
