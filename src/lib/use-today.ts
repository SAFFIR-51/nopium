"use client";
import { useSyncExternalStore } from "react";
import { todayLocal } from "@/lib/repo";

const noop = () => () => {};

/** 오늘 날짜(YYYY-MM-DD). 사전 렌더링 중에는 null을 돌려 방문 시점의 날짜로 계산되게 합니다. */
export function useToday(): string | null {
  return useSyncExternalStore(noop, todayLocal, () => null);
}
