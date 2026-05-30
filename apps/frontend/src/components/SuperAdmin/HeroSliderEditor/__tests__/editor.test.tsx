import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HeroSliderCustomizationPage from "@/app/(super-admin)/super-admin/settings/customization/hero-slider/page";
import SlideList from "@/components/SuperAdmin/HeroSliderEditor/SlideList";
import type { HeroSliderPayload } from "@/types/super-admin/heroSlider";
import { normalizeHeroSliderPayload } from "@/types/super-admin/heroSlider";
import {
  getHeroSliderDraftAndPublished,
  publishHeroSliderDraft,
  updateHeroSliderDraft,
} from "@/services/super-admin/settings/hero-slider";

jest.mock("@/components/SuperAdmin/Layout/ContentWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/SuperAdmin/HeroSliderEditor/PublishBar", () => ({
  __esModule: true,
  default: ({
    draft,
    published,
    onAddSlide,
    onSaveDraft,
    onPublish,
  }: {
    draft: HeroSliderPayload;
    published: HeroSliderPayload;
    onAddSlide: () => void;
    onSaveDraft: () => void;
    onPublish: () => void;
  }) => (
    <section>
      <p>
        تعداد اسلاید پیش‌نویس: {draft.slides.length} | تعداد اسلاید منتشرشده:{" "}
        {published.slides.length}
      </p>
      <button type="button" onClick={onAddSlide}>
        افزودن اسلاید
      </button>
      <button type="button" onClick={onSaveDraft}>
        ذخیره پیش‌نویس
      </button>
      <button type="button" onClick={onPublish}>
        انتشار
      </button>
    </section>
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

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
});

function createHeroState() {
  const draft = normalizeHeroSliderPayload({
    slides: [
      {
        id: "slide-a",
        order: 0,
        isActive: true,
        autoplayEligible: true,
      },
      {
        id: "slide-b",
        order: 1,
        isActive: true,
        autoplayEligible: false,
      },
    ],
  });

  const published = normalizeHeroSliderPayload({
    slides: [],
  });

  return {
    draft,
    published,
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
        slides: [{ id: "published-slide", order: 0, isActive: true, autoplayEligible: true }],
      }),
      meta: {
        version: 2,
        publishedAt: "2026-02-10T10:00:00.000Z",
        publishedBy: 1,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("switches inline editor target when a slot is selected from template preview", async () => {
    render(<HeroSliderCustomizationPage />);

    await waitFor(() => {
      expect(screen.getByText(/در حال ویرایش:/)).toBeInTheDocument();
      expect(screen.getAllByText("تیتر").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /ویرایش تصویر اصلی/i }));

    expect(screen.getAllByText("تصویر اصلی").length).toBeGreaterThan(0);
  });

  it("reorders slides when move controls are used", () => {
    const initialSlides = normalizeHeroSliderPayload({
      slides: [
        { id: "slide-a", order: 0 },
        { id: "slide-b", order: 1 },
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

  it("publishes draft and updates published summary", async () => {
    render(<HeroSliderCustomizationPage />);

    await waitFor(() => {
      expect(screen.getByText(/تعداد اسلاید منتشرشده: 0/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "انتشار" }));

    await waitFor(() => {
      expect(publishHeroSliderDraftMock).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/تعداد اسلاید منتشرشده: 1/)).toBeInTheDocument();
    });
  });
});
