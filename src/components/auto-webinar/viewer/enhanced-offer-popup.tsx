"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  X,
  Gift,
  ExternalLink,
  Users,
  Mail,
  MessageCircle,
  CreditCard,
  Download,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { OfferCountdown } from "./countdown-timer";

type OfferActionType = "EXTERNAL_LINK" | "EMAIL_FORM" | "LINE_FRIEND" | "STRIPE_CHECKOUT" | "DOWNLOAD";

interface EnhancedOffer {
  id: string;
  title: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string;
  actionType: OfferActionType;
  // Email form
  emailFormTitle: string | null;
  emailSuccessMessage: string | null;
  // LINE
  lineAddUrl: string | null;
  // Stripe
  stripePriceId: string | null;
  // Download
  downloadUrl: string | null;
  downloadFileName: string | null;
  // Display
  countdownEnabled: boolean;
  countdownSeconds: number | null;
  limitedSeats: number | null;
  popupPosition: string;
}

interface EnhancedOfferPopupProps {
  offer: EnhancedOffer;
  sessionToken: string;
  contactId?: string;
  webinarId: string;
  onClose: () => void;
  onAction: (offerId: string, actionData?: Record<string, any>) => void;
}

export function EnhancedOfferPopup({
  offer,
  sessionToken,
  contactId,
  webinarId,
  onClose,
  onAction,
}: EnhancedOfferPopupProps) {
  const [dismissed, setDismissed] = useState(false);
  const [countdownExpired, setCountdownExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const positionClasses: Record<string, string> = {
    center: "fixed inset-0 flex items-center justify-center bg-black/60 z-50",
    "bottom-right": "fixed bottom-4 right-4 z-50 max-w-sm",
    "bottom-left": "fixed bottom-4 left-4 z-50 max-w-sm",
  };

  if (dismissed || countdownExpired) {
    return null;
  }

  const handleClose = () => {
    setDismissed(true);
    onClose();
  };

  const getActionIcon = () => {
    switch (offer.actionType) {
      case "EMAIL_FORM":
        return <Mail className="w-5 h-5" />;
      case "LINE_FRIEND":
        return <MessageCircle className="w-5 h-5" />;
      case "STRIPE_CHECKOUT":
        return <CreditCard className="w-5 h-5" />;
      case "DOWNLOAD":
        return <Download className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  // External link action
  const handleExternalLink = () => {
    onAction(offer.id, { type: "click" });
    window.open(offer.buttonUrl, "_blank");
  };

  // Email form submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/auto-webinars/${webinarId}/offers/${offer.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          contactId,
          actionType: "EMAIL_FORM",
          email,
          name,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      setSuccess(true);
      onAction(offer.id, { type: "email_submit", email });
    } catch (err) {
      setError("送信に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // LINE friend add
  const handleLineAdd = () => {
    onAction(offer.id, { type: "line_add" });
    const url = offer.lineAddUrl || `https://line.me/R/ti/p/${offer.buttonUrl}`;
    window.open(url, "_blank");
  };

  // Stripe checkout
  const handleStripeCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/auto-webinars/${webinarId}/offers/${offer.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          contactId,
          priceId: offer.stripePriceId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await res.json();
      if (data.checkoutUrl) {
        onAction(offer.id, { type: "stripe_checkout" });
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError("決済の準備に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  // Download
  const handleDownload = () => {
    onAction(offer.id, { type: "download" });
    if (offer.downloadUrl) {
      const link = document.createElement("a");
      link.href = offer.downloadUrl;
      link.download = offer.downloadFileName || "download";
      link.click();
    }
    setSuccess(true);
  };

  // Success state
  if (success) {
    return (
      <div className={positionClasses[offer.popupPosition] || positionClasses.center}>
        <Card className="shadow-2xl border-2 border-green-500 animate-in fade-in zoom-in duration-300 max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">完了しました！</h3>
            <p className="text-muted-foreground mb-4">
              {offer.actionType === "EMAIL_FORM" && (offer.emailSuccessMessage || "登録が完了しました。メールをご確認ください。")}
              {offer.actionType === "DOWNLOAD" && "ダウンロードが開始されました。"}
              {offer.actionType === "LINE_FRIEND" && "LINE友だち追加ありがとうございます！"}
            </p>
            <Button onClick={handleClose}>閉じる</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (offer.actionType) {
      case "EMAIL_FORM":
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {offer.description && (
              <p className="text-sm text-muted-foreground">{offer.description}</p>
            )}

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="offer-name">お名前</Label>
                <Input
                  id="offer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="山田 太郎"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-email">
                  メールアドレス <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="offer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || !email}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {offer.buttonText}
                </>
              )}
            </Button>
          </form>
        );

      case "LINE_FRIEND":
        return (
          <div className="space-y-4">
            {offer.description && (
              <p className="text-sm text-muted-foreground">{offer.description}</p>
            )}

            <div className="p-4 bg-[#06C755]/10 rounded-lg text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-[#06C755]" />
              <p className="text-sm font-medium">LINE友だち追加で特典GET</p>
            </div>

            <Button
              onClick={handleLineAdd}
              className="w-full bg-[#06C755] hover:bg-[#05b34c]"
              size="lg"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {offer.buttonText}
            </Button>
          </div>
        );

      case "STRIPE_CHECKOUT":
        return (
          <div className="space-y-4">
            {offer.description && (
              <p className="text-sm text-muted-foreground">{offer.description}</p>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              onClick={handleStripeCheckout}
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  準備中...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {offer.buttonText}
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              安全な決済ページに移動します
            </p>
          </div>
        );

      case "DOWNLOAD":
        return (
          <div className="space-y-4">
            {offer.description && (
              <p className="text-sm text-muted-foreground">{offer.description}</p>
            )}

            <Button onClick={handleDownload} className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              {offer.buttonText}
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {offer.description && (
              <p className="text-sm text-muted-foreground">{offer.description}</p>
            )}

            <Button onClick={handleExternalLink} className="w-full" size="lg">
              {offer.buttonText}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );
    }
  };

  const content = (
    <Card className={`shadow-2xl border-2 border-primary animate-in fade-in slide-in-from-bottom-4 duration-500 ${
      offer.popupPosition === "center" ? "max-w-md w-full mx-4" : "w-full"
    }`}>
      <CardHeader className="pb-2 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 text-primary">
          {getActionIcon()}
          <span className="text-sm font-medium">特別オファー</span>
        </div>
        <CardTitle className="pr-8">{offer.title}</CardTitle>

        <div className="flex items-center gap-4 text-sm pt-2">
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
      </CardHeader>

      <CardContent>{renderContent()}</CardContent>
    </Card>
  );

  if (offer.popupPosition === "center") {
    return (
      <div
        className={positionClasses.center}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return <div className={positionClasses[offer.popupPosition] || positionClasses["bottom-right"]}>{content}</div>;
}

/**
 * Enhanced offers container
 */
interface EnhancedOffersContainerProps {
  offers: EnhancedOffer[];
  currentPosition: number;
  sessionToken: string;
  contactId?: string;
  webinarId: string;
  onOfferAction: (offerId: string, actionData?: Record<string, any>) => void;
}

export function EnhancedOffersContainer({
  offers,
  currentPosition,
  sessionToken,
  contactId,
  webinarId,
  onOfferAction,
}: EnhancedOffersContainerProps) {
  const [dismissedOffers, setDismissedOffers] = useState<Set<string>>(new Set());

  const visibleOffers = offers.filter((offer) => {
    if (dismissedOffers.has(offer.id)) return false;

    const appearAt = (offer as any).appearAtSeconds || 0;
    const hideAt = (offer as any).hideAtSeconds;

    const shouldAppear = currentPosition >= appearAt;
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

  return (
    <EnhancedOfferPopup
      offer={activeOffer}
      sessionToken={sessionToken}
      contactId={contactId}
      webinarId={webinarId}
      onClose={() => handleDismiss(activeOffer.id)}
      onAction={onOfferAction}
    />
  );
}
