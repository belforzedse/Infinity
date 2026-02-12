import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HeroSliderCustomizationPage from "@/app/(super-admin)/super-admin/settings/customization/hero-slider/page";
import SlideList from "../SlideList";
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
    updateHeroSliderDraftMock.mockImplementation(async (payload: any) => payload);
    publishHeroSliderDraftMock.mockResolvedValue({
      published: normalizeHeroSliderPayload({
        slides: [{ id: "published-slide", order: 0, isActive: true, autoplayEligible: true }],
      }),
      meta: {
        version: 1,
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
      expect(screen.getByText(/اسلات در حال ویرایش:/)).toBeInTheDocument();
      expect(screen.getByText("تیتر")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /ویرایش تصویر اصلی/i }));

    expect(screen.getByText("تصویر اصلی")).toBeInTheDocument();
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
