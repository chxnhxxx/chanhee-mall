"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import type { OrderStatus } from "@/lib/domain";
import { cancelOrderAction, requestReturnAction } from "@/server/actions/orders";

export function OrderActions({ orderNumber, status }: { orderNumber: string; status: OrderStatus }) {
  const t = useTranslations("orders");
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reason, setReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);

  const canCancel = status === "pending_payment" || status === "paid";
  const canReturn = status === "shipping" || status === "delivered";
  if (!canCancel && !canReturn) return null;

  return (
    <div className="flex flex-col gap-3">
      {canCancel ? (
        <Button
          variant="destructive"
          disabled={pending}
          data-testid="cancel-order"
          onClick={() => {
            if (!window.confirm(t("cancelConfirm"))) return;
            start(async () => {
              const res = await cancelOrderAction(orderNumber);
              if (!res.ok) return void toast.error(te(res.code as never));
              toast.success(t("cancelled"));
              router.refresh();
            });
          }}
        >
          {t("cancel")}
        </Button>
      ) : null}

      {canReturn && !showReturn ? (
        <Button variant="outline" onClick={() => setShowReturn(true)}>
          {t("requestReturn")}
        </Button>
      ) : null}
      {canReturn && showReturn ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await requestReturnAction(orderNumber, reason);
              if (!res.ok) return void toast.error(te(res.code as never));
              toast.success(t("returnRequested"));
              router.refresh();
            });
          }}
        >
          <Textarea
            placeholder={t("returnReason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            required
            minLength={2}
          />
          <Button type="submit" disabled={pending || reason.trim().length < 2}>
            {t("requestReturn")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
