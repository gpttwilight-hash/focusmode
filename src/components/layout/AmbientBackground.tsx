"use client";

import DotField from "@/components/layout/DotField";
import { useTimerStore } from "@/lib/store/timer-store";
import {
  DOT_FIELD_BACKGROUND_PROPS,
  getDotFieldLayerClassName,
} from "./dot-field-style";

export function AmbientBackground() {
  const status = useTimerStore((s) => s.status);

  return (
    <div className={getDotFieldLayerClassName(status)} aria-hidden="true">
      <DotField {...DOT_FIELD_BACKGROUND_PROPS} />
    </div>
  );
}
