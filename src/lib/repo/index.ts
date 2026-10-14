"use client";
import { useSyncExternalStore } from "react";
import { localRepository } from "./local-repository";
import type { CareRepository } from "./types";

export * from "./types";
export { todayLocal } from "./local-repository";

/**
 * 화면에서 사용하는 저장소. 서버 구현이 준비되면 여기서만 교체합니다.
 * 예: process.env.NEXT_PUBLIC_DATA_SOURCE === "server" ? serverRepository : localRepository
 */
export const careRepo: CareRepository = localRepository;

export function useCare() {
  return useSyncExternalStore(careRepo.subscribe, careRepo.getSnapshot, careRepo.getServerSnapshot);
}
