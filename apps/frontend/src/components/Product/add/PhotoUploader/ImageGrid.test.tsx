import { fireEvent, render, screen } from "@testing-library/react";
import PhotoUploaderImageGrid from "@/components/Product/add/PhotoUploader/ImageGrid";

jest.mock("@/components/Product/add/PhotoUploader/ImagePreview", () => ({
  __esModule: true,
  default: ({ preview, index, onRemove }: { preview: string; index: number; onRemove: () => void }) => (
    <button type="button" data-testid={`remove-${index}`} onClick={onRemove}>
      {preview}
    </button>
  ),
}));

jest.mock("@dnd-kit/core", () => {
  const React = require("react");

  return {
    __esModule: true,
    DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (event: unknown) => void }) => (
      <div>
        {children}
        <button
          type="button"
          data-testid="trigger-drag"
          onClick={() => {
            const els = document.querySelectorAll("[data-sortable-id]");
            const id0 = els[0]?.getAttribute("data-sortable-id");
            const id1 = els[1]?.getAttribute("data-sortable-id");
            if (id0 && id1) {
              onDragEnd({ active: { id: id0 }, over: { id: id1 } });
            }
          }}
        >
          trigger drag
        </button>
      </div>
    ),
    KeyboardSensor: function KeyboardSensor() {},
    PointerSensor: function PointerSensor() {},
    closestCenter: jest.fn(),
    useSensor: jest.fn((sensor: unknown, options?: unknown) => ({ sensor, options })),
    useSensors: jest.fn((...args: unknown[]) => args),
  };
});

jest.mock("@dnd-kit/sortable", () => {
  const React = require("react");

  return {
    __esModule: true,
    SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    rectSortingStrategy: jest.fn(),
    sortableKeyboardCoordinates: jest.fn(),
    useSortable: jest.fn(() => ({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: undefined,
    })),
  };
});

jest.mock("@dnd-kit/utilities", () => ({
  __esModule: true,
  CSS: {
    Transform: {
      toString: jest.fn(() => undefined),
    },
  },
}));

describe("PhotoUploaderImageGrid", () => {
  it("calls onReorder with resolved indexes on drag end", () => {
    const onReorder = jest.fn();

    render(
      <PhotoUploaderImageGrid
        previews={["/one.jpg", "/two.jpg"]}
        onRemoveFile={jest.fn()}
        onReorder={onReorder}
      />,
    );

    fireEvent.click(screen.getByTestId("trigger-drag"));

    expect(onReorder).toHaveBeenCalledWith(0, 1);
  });

  it("keeps remove callback behavior", () => {
    const onRemoveFile = jest.fn();

    render(
      <PhotoUploaderImageGrid previews={["/one.jpg", "/two.jpg"]} onRemoveFile={onRemoveFile} />,
    );

    fireEvent.click(screen.getByTestId("remove-0"));

    expect(onRemoveFile).toHaveBeenCalledWith(0);
  });

  it("does not mount DndContext when onReorder is not provided", () => {
    render(
      <PhotoUploaderImageGrid
        previews={["/one.jpg", "/two.jpg"]}
        onRemoveFile={jest.fn()}
      />,
    );

    expect(screen.queryByTestId("trigger-drag")).toBeNull();
  });
});
