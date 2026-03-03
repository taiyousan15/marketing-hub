"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Gift, ExternalLink, Clock, Users, MessageSquare, Bell, UserPlus } from "lucide-react";
import { OfferCountdown } from "./countdown-timer";

type ActionType =
  | "EXTERNAL_LINK"
  | "LINE_FRIEND"
  | "SURVEY"
  | "ANNOUNCEMENT"
  | "EMAIL_FORM"
  | "STRIPE_CHECKOUT"
  | "DOWNLOAD"
  | "CUSTOM";

interface TimedOffer {
  id: string;
  title: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string | null;
  actionType?: ActionType;
  countdownEnabled: boolean;
  countdownSeconds: number | null;
  limitedSeats: number | null;
  liffId?: string | null;
  surveyUrl?: string | null;
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
    "bottom-right": "fixed bottom-4 right-4 max-w-sm z-50",
    "bottom-left": "fixed bottom-4 left-4 max-w-sm z-50",
    center: "fixed inset-0 flex items-center justify-center bg-black/50 z-50",
  };

  if (dismissed || countdownExpired) {
    return null;
  }

  const actionType = offer.actionType ?? "EXTERNAL_LINK";

  const handleButtonClick = () => {
    onButtonClick(offer.id);

    if (actionType === "LINE_FRIEND" && offer.liffId) {
      window.open(`https://liff.line.me/${offer.liffId}`, "_blank");
    } else if (actionType === "SURVEY" && offer.surveyUrl) {
      window.open(offer.surveyUrl, "_blank");
    } else if (offer.buttonUrl) {
      window.open(offer.buttonUrl, "_blank");
    }

    if (actionType !== "ANNOUNCEMENT") {
      setDismissed(true);
      onClose();
    }
  };

  const dismiss = () => {
    setDismissed(true);
    onClose();
  };

  const headerIcon = {
    LINE_FRIEND: <UserPlus className="w-5 h-5" />,
    SURVEY: <MessageSquare className="w-5 h-5" />,
    ANNOUNCEMENT: <Bell className="w-5 h-5" />,
    EMAIL_FORM: <Gift className="w-5 h-5" />,
    EXTERNAL_LINK: <Gift className="w-5 h-5" />,
    STRIPE_CHECKOUT: <Gift className="w-5 h-5" />,
    DOWNLOAD: <Gift className="w-5 h-5" />,
    CUSTOM: <Gift className="w-5 h-5" />,
  }[actionType] ?? <Gift className="w-5 h-5" />;

  const headerLabel = {
    LINE_FRIEND: "LINE友達追加",
    SURVEY: "アンケート",
    ANNOUNCEMENT: "お知らせ",
    EMAIL_FORM: "メール登録",
    EXTERNAL_LINK: "特別オファー",
    STRIPE_CHECKOUT: "特別オファー",
    DOWNLOAD: "ダウンロード",
    CUSTOM: "お知らせ",
  }[actionType] ?? "特別オファー";

  const buttonLabel = (offer.buttonText || {
    LINE_FRIEND: "友達追加する",
    SURVEY: "アンケートに答える",
    EXTERNAL_LINK: "今すぐ申し込む",
    EMAIL_FORM: "登録する",
    STRIPE_CHECKOUT: "購入する",
    DOWNLOAD: "ダウンロード",
    ANNOUNCEMENT: "閉じる",
    CUSTOM: "詳しく見る",
  }[actionType]) ?? "今すぐ申し込む";

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
          onClick={dismiss}
        >
          <X className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 text-primary">
          {headerIcon}
          <span className="text-sm font-medium">{headerLabel}</span>
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

        {/* LINE友達追加: QRコードや説明 */}
        {actionType === "LINE_FRIEND" && offer.liffId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            LINEアプリで友達追加して特典を受け取りましょう
          </div>
        )}

        {/* お知らせのみ: ボタン不要 */}
        {actionType === "ANNOUNCEMENT" ? (
          <Button variant="outline" className="w-full" onClick={dismiss}>
            閉じる
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={handleButtonClick}>
            {actionType === "LINE_FRIEND" && <UserPlus className="w-4 h-4 mr-2" />}
            {actionType === "SURVEY" && <MessageSquare className="w-4 h-4 mr-2" />}
            {actionType === "EXTERNAL_LINK" && <ExternalLink className="w-4 h-4 mr-2" />}
            {buttonLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (position === "center") {
    return (
      <div
        className={positionClasses[position]}
        onClick={(e) => {
          if (e.target === e.currentTarget) dismiss();
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
interface ContainerTimedOffer {
  id: string;
  appearAtSeconds: number;
  hideAtSeconds: number | null;
  popupPosition?: string;
  title: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string | null;
  actionType?: ActionType;
  countdownEnabled: boolean;
  countdownSeconds: number | null;
  limitedSeats: number | null;
  liffId?: string | null;
  surveyUrl?: string | null;
}

interface TimedOffersContainerProps {
  offers: ContainerTimedOffer[];
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
  const [dismissedOffers, setDismissedOffers] = useState<Set<string>>(new Set());

  const visibleOffers = offers.filter((offer) => {
    if (dismissedOffers.has(offer.id)) return false;

    const shouldAppear = currentPosition >= offer.appearAtSeconds;
    const hideAt = offer.hideAtSeconds;
    const shouldNotHide = !hideAt || currentPosition < hideAt;

    return shouldAppear && shouldNotHide;
  });

  const handleDismiss = (offerId: string) => {
    setDismissedOffers((prev) => new Set([...prev, offerId]));
  };

  if (visibleOffers.length === 0) {
    return null;
  }

  const activeOffer = visibleOffers[visibleOffers.length - 1];
  const popupPosition = activeOffer.popupPosition;
  const pos =
    popupPosition === "CENTER"
      ? "center"
      : popupPosition === "BOTTOM_LEFT"
      ? "bottom-left"
      : "bottom-right";

  return (
    <TimedOfferPopup
      offer={activeOffer}
      onClose={() => handleDismiss(activeOffer.id)}
      onButtonClick={onOfferClick}
      position={pos}
    />
  );
}
