import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HeroSliderCustomizationPage from "@/app/(super-admin)/super-admin/customization/hero-slider/page";
import SlideList from "@/components/SuperAdmin/HeroSliderEditor/SlideList";
import type { HeroSliderPayload } from "@/types/super-admin/heroSliderV3";
import { normalizeHeroSliderPayload } from "@/types/super-admin/heroSliderV3";
import {
  getHeroSliderDraftAndPublished,
  publishHeroSliderDraft,
  updateHeroSliderDraft,
} from "@/services/super-admin/settings/hero-slider";

jest.mock("@/components/SuperAdmin/Layout/ContentWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    urlInputAriaLabel = "آدرس تصویر",
  }: {
    value: string;
    onChange: (value: string) => void;
    urlInputAriaLabel?: string;
  }) => (
    <input
      aria-label={urlInputAriaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("@/services/super-admin/settings/hero-slider", () => ({
  getHeroSliderDraftAndPublished: jest.fn(),
  updateHeroSliderDraft: jest.fn(),
  publishHeroSliderDraft: jest.fn(),
}));

const getHeroSliderDraftAndPublishedMock = getHeroSliderDraftAndPublished as jest.Mock;
const updateHeroSliderDraftMock = updateHeroSliderDraft as jest.Mock;
const publishHeroSliderDraftMock = publishHeroSliderDraft as jest.Mock;

function createHeroState() {
  const draft = normalizeHeroSliderPayload({
    slides: [
      {
        id: "slide-a",
        imageUrl: "/uploads/a.webp",
        imageAlt: "بنر اول",
        order: 0,
        isActive: true,
        autoplayEligible: true,
      },
      {
        id: "slide-b",
        imageUrl: "/uploads/b.webp",
        imageAlt: "بنر دوم",
        order: 1,
        isActive: true,
        autoplayEligible: false,
      },
    ],
  });

  return {
    draft,
    published: normalizeHeroSliderPayload({ slides: [] }),
    meta: null,
  };
}

describe("Hero slider editor", () => {
  beforeEach(() => {
    const initial = createHeroState();

    getHeroSliderDraftAndPublishedMock.mockResolvedValue(initial);
    updateHeroSliderDraftMock.mockImplementation(async (payload: HeroSliderPayload) => payload);
    publishHeroSliderDraftMock.mockResolvedValue({
      published: normalizeHeroSliderPayload({
        slides: [{ id: "published-slide", imageUrl: "/uploads/published.webp", order: 0 }],
      }),
      meta: {
        version: 3,
        publishedAt: "2026-02-10T10:00:00.000Z",
        publishedBy: 1,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the simplified single-image editor", async () => {
    render(<HeroSliderCustomizationPage />);

    await waitFor(() => {
      expect(screen.getByText("پیش‌نمایش بنر هیرو")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("تصویر بنر دسکتاپ")).toHaveValue("/uploads/a.webp");
    expect(screen.getByDisplayValue("بنر اول")).toBeInTheDocument();
    expect(screen.queryByText(/در حال ویرایش:/)).not.toBeInTheDocument();
  });

  it("auto-saves the selected slide banner image", async () => {
    render(<HeroSliderCustomizationPage />);

    const imageInput = await screen.findByLabelText("تصویر بنر دسکتاپ");
    fireEvent.change(imageInput, { target: { value: "/uploads/new.webp" } });

    await waitFor(() => {
      expect(updateHeroSliderDraftMock).toHaveBeenCalledTimes(1);
    });

    const savedPayload = updateHeroSliderDraftMock.mock.calls[0][0] as HeroSliderPayload;
    expect(savedPayload.slides[0].imageUrl).toBe("/uploads/new.webp");
  });

  it("saves draft before publishing", async () => {
    render(<HeroSliderCustomizationPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "انتشار" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "انتشار" }));

    await waitFor(() => {
      expect(updateHeroSliderDraftMock).toHaveBeenCalledTimes(1);
      expect(publishHeroSliderDraftMock).toHaveBeenCalledTimes(1);
    });
  });

  it("reorders slides when move controls are used", () => {
    const initialSlides = normalizeHeroSliderPayload({
      slides: [
        { id: "slide-a", imageUrl: "/uploads/a.webp", order: 0 },
        { id: "slide-b", imageUrl: "/uploads/b.webp", order: 1 },
      ],
    }).slides;

    function Harness() {
      const [slides, setSlides] = useState(initialSlides);
      return (
        <div>
          <div data-testid="first-slide-id">{slides[0]?.id}</div>
          <SlideList
            slides={slides}
            selectedSlideId={slides[0]?.id || null}
            onSelectSlide={() => {}}
            onAddSlide={() => {}}
            onDuplicateSlide={() => {}}
            onDeleteSlide={() => {}}
            onReorderSlides={setSlides}
          />
        </div>
      );
    }

    render(<Harness />);

    expect(screen.getByTestId("first-slide-id")).toHaveTextContent("slide-a");

    const moveDownButtons = screen.getAllByRole("button", { name: "انتقال اسلاید به پایین" });
    fireEvent.click(moveDownButtons[0]);

    expect(screen.getByTestId("first-slide-id")).toHaveTextContent("slide-b");
  });

  it("saves draft before publishing and updates published summary", async () => {
    render(<HeroSliderCustomizationPage />);

    await waitFor(() => {
      expect(screen.getByText(/تعداد اسلاید منتشرشده: 0/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "انتشار" }));

    await waitFor(() => {
      expect(updateHeroSliderDraftMock).toHaveBeenCalledTimes(1);
      expect(publishHeroSliderDraftMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/تعداد اسلاید منتشرشده: 1/)).toBeInTheDocument();
    });
  });
});
