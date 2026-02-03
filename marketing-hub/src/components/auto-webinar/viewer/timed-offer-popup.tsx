"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Gift, ExternalLink, Clock, Users } from "lucide-react";
import { OfferCountdown } from "./countdown-timer";

interface TimedOffer {
  id: string;
  title: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string;
  countdownEnabled: boolean;
  countdownSeconds: number | null;
  limitedSeats: number | null;
}

interface TimedOfferPopupProps {
  offer: TimedOffer;
  onClose: () => void;
  onButtonClick: (offerId: string) => void;
  position?: "bottom-right" | "bottom-left" | "center";
}

export function TimedOfferPopup({
  offer,
  onClose,
  onButtonClick,
  position = "bottom-right",
}: TimedOfferPopupProps) {
  const [dismissed, setDismissed] = useState(false);
  const [countdownExpired, setCountdownExpired] = useState(false);

  const positionClasses = {
    "bottom-right": "fixed bottom-4 right-4 max-w-sm",
    "bottom-left": "fixed bottom-4 left-4 max-w-sm",
    center: "fixed inset-0 flex items-center justify-center bg-black/50",
  };

  if (dismissed || countdownExpired) {
    return null;
  }

  const handleButtonClick = () => {
    onButtonClick(offer.id);
    window.open(offer.buttonUrl, "_blank");
  };

  const content = (
    <Card
      className={`shadow-xl border-2 border-primary animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        position === "center" ? "max-w-md mx-4" : ""
      }`}
    >
      <CardHeader className="pb-2 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => {
            setDismissed(true);
            onClose();
          }}
        >
          <X className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 text-primary">
          <Gift className="w-5 h-5" />
          <span className="text-sm font-medium">特別オファー</span>
        </div>
        <CardTitle className="pr-8">{offer.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {offer.description && (
          <p className="text-sm text-muted-foreground">{offer.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm">
          {offer.countdownEnabled && offer.countdownSeconds && (
            <OfferCountdown
              seconds={offer.countdownSeconds}
              onComplete={() => setCountdownExpired(true)}
            />
          )}
          {offer.limitedSeats && (
            <div className="flex items-center gap-1 text-primary font-medium">
              <Users className="w-4 h-4" />
              <span>残り {offer.limitedSeats} 席</span>
            </div>
          )}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleButtonClick}
        >
          {offer.buttonText}
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  if (position === "center") {
    return (
      <div
        className={positionClasses[position]}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setDismissed(true);
            onClose();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return <div className={positionClasses[position]}>{content}</div>;
}

/**
 * 複数オファーを管理するコンテナ
 */
interface TimedOffersContainerProps {
  offers: TimedOffer[];
  currentPosition: number;
  videoDuration: number;
  onOfferClick: (offerId: string) => void;
}

export function TimedOffersContainer({
  offers,
  currentPosition,
  videoDuration,
  onOfferClick,
}: TimedOffersContainerProps) {
  const [dismissedOffers, setDismissedOffers] = useState<Set<string>>(
    new Set()
  );

  // 現在表示すべきオファーをフィルター
  const visibleOffers = offers.filter((offer) => {
    // 却下されたオファーは表示しない
    if (dismissedOffers.has(offer.id)) return false;

    // appearAtSecondsを超えているか
    const shouldAppear = currentPosition >= (offer as any).appearAtSeconds;

    // hideAtSecondsが設定されている場合、それを超えていないか
    const hideAt = (offer as any).hideAtSeconds;
    const shouldNotHide = !hideAt || currentPosition < hideAt;

    return shouldAppear && shouldNotHide;
  });

  const handleDismiss = (offerId: string) => {
    setDismissedOffers((prev) => new Set([...prev, offerId]));
  };

  if (visibleOffers.length === 0) {
    return null;
  }

  // 最新の1つだけ表示（複数表示したい場合は調整）
  const activeOffer = visibleOffers[visibleOffers.length - 1];

  return (
    <TimedOfferPopup
      offer={activeOffer}
      onClose={() => handleDismiss(activeOffer.id)}
      onButtonClick={onOfferClick}
      position="bottom-right"
    />
  );
}
