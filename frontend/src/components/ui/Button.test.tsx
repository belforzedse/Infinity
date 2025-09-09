import { render, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button component', () => {
  it('renders with text and handles click', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(<Button onClick={handleClick}>Click</Button>);
    const button = getByRole('button', { name: /click/i });
    expect(button).toHaveClass('btn');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it('does not trigger click when disabled', () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    const button = getByRole('button', { name: /disabled/i });
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
