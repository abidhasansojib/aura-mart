/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Star,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BannerItem, getFallbackBannerFromSettings } from "@/lib/banner-templates";

interface HeroBannerSliderProps {
  banners?: BannerItem[];
  defaultSettings?: {
    heroTitle?: string;
    storeName?: string;
    heroTagline?: string;
    tagline?: string;
    heroBadgeText?: string;
    heroBadgeSecondary?: string;
    heroCtaText?: string;
  };
}

export function HeroBannerSlider({ banners = [], defaultSettings }: HeroBannerSliderProps) {
  // Use active banners or fallback to default store settings banner
  const activeBanners = banners.filter((b) => b.isActive);
  const slideList: BannerItem[] =
    activeBanners.length > 0
      ? activeBanners
      : [getFallbackBannerFromSettings(defaultSettings)];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slideList.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const handleGoTo = (index: number) => {
    setCurrentIndex(index);
  };

  // Autoplay timer (5 seconds per slide), paused on hover/touch
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      handleNext();
    }, 5000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [totalSlides, isPaused, handleNext, currentIndex]);

  // Touch gesture handling for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40; // 40px threshold

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      handlePrev();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  const currentBanner = slideList[currentIndex] || slideList[0];
  const bgGradient =
    currentBanner.bgGradient || "from-[#FF6448] via-[#FF755B] to-[#FF8A73]";

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`col-span-12 md:col-span-7 bg-gradient-to-br ${bgGradient} text-white rounded-[24px] sm:rounded-[32px] p-4 xs:p-6 sm:p-10 shadow-xl flex flex-col justify-between bento-card relative overflow-hidden group select-none min-h-[300px] xs:min-h-[340px] sm:min-h-[380px] transition-all duration-500 no-scrollbar [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] isolate`}
      style={{
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        transform: "translateZ(0)",
      }}
    >
      {/* Background Photo Layer (Full-bleed card background when image is provided) */}
      {currentBanner.imageUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover object-center scale-100 transition-transform duration-700 group-hover:scale-105"
          />
          {/* Theme Tint & Vignette Overlays for 100% Text & Badge Legibility */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${bgGradient} opacity-75 mix-blend-multiply`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
          <div className="absolute inset-0 bg-black/25" />
        </div>
      )}

      {/* 1. Header Badges */}
      <div className="space-y-2.5 sm:space-y-4 relative z-10">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {currentBanner.badgeText && (
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold border border-white/20 shadow-xs animate-in fade-in duration-300">
              <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-200" />
              <span>{currentBanner.badgeText}</span>
            </span>
          )}

          {currentBanner.badgeSecondary && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-950/30 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold border border-white/10 shadow-xs animate-in fade-in duration-300">
              <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
              <span>{currentBanner.badgeSecondary}</span>
            </span>
          )}
        </div>

        {/* Content Headline & Subtitle */}
        <div className="space-y-2 max-w-xl">
          <h1
            key={`title-${currentIndex}`}
            className="text-xl xs:text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {currentBanner.title}
          </h1>

          {currentBanner.subtitle && (
            <p
              key={`subtitle-${currentIndex}`}
              className="text-[11px] xs:text-xs sm:text-sm text-white/95 leading-relaxed font-medium line-clamp-3 sm:line-clamp-none animate-in fade-in slide-in-from-bottom-3 duration-300"
            >
              {currentBanner.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* 2. Bottom Row: CTA Button + Navigation Dots */}
      <div className="pt-4 sm:pt-6 relative z-10 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
        {/* Call to Action Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={currentBanner.ctaLink || "#catalog"}
            className="inline-flex items-center justify-center gap-1.5 bg-[#181A1D] hover:bg-black text-white text-xs sm:text-sm font-bold px-4 xs:px-6 sm:px-7 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 min-h-[38px] sm:min-h-[44px]"
          >
            <span>{currentBanner.ctaText || "Shop Catalog"}</span>
            <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          </a>

          <span className="hidden sm:inline-flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] xs:text-[11px] sm:text-xs font-semibold bg-white/20 backdrop-blur-md px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl border border-white/25 text-white shadow-xs">
            <CheckCircle2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-white" />
            <span>Fast Shipping</span>
          </span>
        </div>

        {/* Carousel Navigation Dots & Counter */}
        {totalSlides > 1 && (
          <div className="flex items-center gap-2 self-center xs:self-auto pt-1 xs:pt-0">
            {/* Desktop Navigation Chevrons */}
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous banner"
                className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next banner"
                className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Pagination Indicators (Story-Style Animated Active Progress Pill) */}
            <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 shadow-xs">
              {slideList.map((slide, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => handleGoTo(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? "w-8 bg-white/30 shadow-xs"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  >
                    {isActive && (
                      <span
                        key={`pill-fill-${currentIndex}`}
                        className={`absolute inset-0 bg-white rounded-full ${
                          isPaused ? "w-full" : "animate-[progress_5s_linear]"
                        }`}
                        style={
                          !isPaused
                            ? {
                                animation: "progress 5s linear forwards",
                              }
                            : { width: "100%" }
                        }
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Slide Index Badge */}
            <span className="text-[10px] font-mono font-bold text-white/80 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {currentIndex + 1}/{totalSlides}
            </span>
          </div>
        )}
      </div>

      {/* Visual Watermark & Lighting */}
      <div className="absolute -right-8 -bottom-8 w-72 h-44 striped-bar-pattern opacity-25 pointer-events-none rounded-tl-full" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      {/* Keyframe animation inline style */}
      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
